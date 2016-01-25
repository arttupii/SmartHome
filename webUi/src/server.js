var _ = require('underscore');
var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var basicAuth = require('basic-auth');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var nexa = require('nexa');
var ns = require('nested-structure');
var toDot = require('to-dot');

var server = express();
server.use(express.static('./public'));

//Tansmitter is connected to GPIO6
nexa.nexaInit(setup.gpioPort);

var controller_id = setup.controller_id;
/*
//var port = 8085;
require('rconsole')
console.set({
  facility: 'local0'      // default: user 
  , title: 'SmartHome'       // default: node -- can also be set with `process.title` 
  , highestLevel: 'debug'  // [emerg, alert, crit, err, warning, notice, info, debug] 
  , stdout: true         // default: false 
  , stderr: true          // default: true 
  , syslog: true          // default: true 
  , syslogHashTags: false // default: false 
  , showTime: true        // default: true  
  , showLine: true        // default: true 
  , showFile: true        // default: true 
  , showTags: true        // default: true 
})
*/

/*server.listen(port, function() {
    console.log('server listening on port ' + port);
});*/

var powerOffChangeDetected=false;

// Authenticator
app.use(function(req, res, next) {
    var auth;

    // check whether an autorization header was send    
    if (req.headers.authorization) {
      auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
    }

    if (!auth || auth[0] !== setup.user || auth[1] !== setup.password) {
        // any of the tests failed
        // send an Basic Auth request (HTTP Code: 401 Unauthorized)
        res.statusCode = 401;
        // MyRealmName can be changed to anything, will be prompted to the user
        res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
        // this will displayed in the browser when authorization is cancelled
        res.end('Unauthorized');
    } else {
        // continue with processing, user was authenticated
        next();
    }
});

app.use(express.static('./public'));

app.ws('/', function(ws, req) {
	ws.on('message', function(msg) {
		console.log("Message " + msg);
		msg = JSON.parse(msg);
		
		if(msg.cmd==='get') {
			console.log("Asked all  " + msg);
			sendToClient(ws,createMsg("all",config));
		}
		
		if(msg.cmd==='update') {
			var dotNotations = toDot(msg.data);
			_.keys(dotNotations).forEach(function(dot){
				if(dot.indexOf("dummy")===-1) {
					var value = dotNotations[dot];
					var ob = {};
					ns(config).set(dot, value);
					ns(ob).set(dot, value, true);
					if(dot.indexOf("powerOn")!==-1) {
						console.info("Power state is updated by user. %s=%s", dot, value, parseInt(dot));
						powerOffChangeEvent(config.devices[parseInt(dot.split(".")[1])], ws, "user")
					} else {
						sendChangeForClients(createMsg("update", ob), ws);
					}
				}
			});
			fs.writeFileSync("./config.json", JSON.stringify(config,0,4));
		}
		if(msg.cmd==='pair') {
			var pair = msg.data.cmd;
			var deviceID = msg.data.device;
			if(pair==="pair") {
				console.info("Pairing request: deviceId = " + deviceID);
				nexa.nexaPairing(controller_id, deviceID, function(){
					sendToClient(ws,createMsg("pair", "pair done"));
				});
			}
			if(pair==="unpair") {
				console.info("Unpairing request: deviceId = " + deviceID);
				nexa.nexaUnpairing(controller_id, deviceID, function(){
					sendToClient(ws,createMsg("pair", "unpair done"))
				});
			}
		}
	});
});


var aWss = expressWs.getWss('/');

function sendToClient(client, msg) {
	try{
		client.send(msg);
	} catch(err) {
		console.info(err);
	}
}

function sendChangeForClients(change, ignoreClient) {
	console.info("Send change for all clients..." + JSON.stringify(change));
	aWss.clients.forEach(function (client) {
		if(ignoreClient===undefined || ignoreClient!==client) {
			sendToClient(client,change);
		}
	});

}

function createMsg(cmd, data) {
	return JSON.stringify({
		date: Date.now(),
		cmd: cmd,
		data: data
	});
}

app.listen(setup.listenPort);
			
function sendPortStatesToTarget(tryToSendCnt) {
	return Promise.each(_.range(0,tryToSendCnt), function (){
		return Promise.each(_.values(config.devices), function (device){
			return new Promise(function (resolve, reject)  {
					if(device.powerOn) {
						if(device.dim>0) {
							nexa.nexaDim(controller_id, device.id,device.dim, function() {
								resolve();
							});
						} else {
							nexa.nexaOn(controller_id, device.id, function() {

								resolve();
							});
						}
					} else {
						nexa.nexaOff(controller_id, device.id, function() {
							resolve();
						});
					}
			});
		}).catch(function (err){
			console.error(err);
		});
	});
}

function powerOffChangeEvent(device, ignoreClient, eventReason) {
	if(device.statusInfo===undefined) {
		device.statusInfo = {}
	}
	var now = new Date();
	if(device.powerOn){
		device.statusInfo.onTime = now.toISOString();
	}
	else {
		device.statusInfo.offTime = now.toISOString();
	}
	device.statusInfo.lastEventReason = eventReason;
	powerOffChangeDetected=true;

	var ob = {
				"devices": {
				}
			};

	ob.devices[device.id.toString()] = {};
	ob.devices[device.id.toString()].powerOn = device.powerOn;
	ob.devices[device.id.toString()].statusInfo = device.statusInfo;
	sendChangeForClients(createMsg("update", ob), ignoreClient);
}
function checkTimers() {
	return function() {
		function isNow(timeStr) {
			var now = new Date();
			var t = timeStr.split(":");
			var ret = parseInt(t[0]) === now.getHours() && parseInt(t[1]) === now.getMinutes();
			//console.info("isNow(), %d:%d <--> %d:%d   --> ret=%d", t[0], t[1], now.getHours(), now.getMinutes(), ret);
			return ret;
		}
		
		function updatePowerOffState(device, state, reason) {
			console.info("!!!!!Update power state to %s (timer), device=%d", state, device.id);
			device.powerOn = state; 
			powerOffChangeEvent(device, undefined, "timer")
			
			fs.writeFileSync("./config.json", JSON.stringify(config,0,4));
		}
		
		return Promise.each(_.values(config.devices), function (device){
			var isTimeOn = isNow(device.event.timeOn);
			var isTimeOff = isNow(device.event.timeOff);

			if(device.powerOn===true && device.statusInfo!==undefined && device.statusInfo.onTime!==undefined && device.maxOnTime!==undefined && device.maxOnTime>0) {
				var onTime = (new Date(device.statusInfo.onTime)).getTime()/(1000*60);
				var now = (new Date()).getTime()/(1000*60);
				if((now-onTime)>=device.maxOnTime) {
					updatePowerOffState(device, false, "maxOnTimer");
				}
				//console.info("DEBUG %s-%s = %s    --> %s --> %s", now, onTime, (now-onTime), device.maxOnTime, (now-onTime)>=device.maxOnTime);
			}
			
			if( isTimeOn && device.powerOn===false || isTimeOff && device.powerOn===true ) {
				var setPowerOn = true;
				if(isTimeOff) setPowerOn = false;
				
				if(device.event.repeatingEvent.ma || device.event.repeatingEvent.tu || 
				device.event.repeatingEvent.we || device.event.repeatingEvent.th || 
				device.event.repeatingEvent.fr || device.event.repeatingEvent.sa  || 
				device.event.repeatingEvent.su ) {
					var now = new Date();
					switch(now.getDay()) {
						case 0: if(device.event.repeatingEvent.su) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 1: if(device.event.repeatingEvent.mo) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 2: if(device.event.repeatingEvent.tu) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 3: if(device.event.repeatingEvent.we) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 4: if(device.event.repeatingEvent.th) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 5: if(device.event.repeatingEvent.fr) {updatePowerOffState(device, setPowerOn, "timer");} break;
						case 6: if(device.event.repeatingEvent.sa) {updatePowerOffState(device, setPowerOn, "timer");} break;
					}	
				} else {
					if(isTimeOn) device.event.timeOn = "";
					if(isTimeOff) device.event.timeOff = "";
					updatePowerOffState(device, setPowerOn, "timer");
				}
			}
		}).catch(function (err){
			console.error(err);
		});	
	}
}

var updaloopCnt=1;
function updateLoop() {
	return Promise.delay(1000)
		.then(checkTimers())
		.then(function(){
			updaloopCnt++;
			if(updaloopCnt>=45 || powerOffChangeDetected) {
				var tryToSendCnt = powerOffChangeDetected?3:1;
				powerOffChangeDetected = false;
				updaloopCnt = 0;
				return sendPortStatesToTarget(tryToSendCnt);
			}
			return Promise.resolve();
		})
		.then(function(){
			return updateLoop();
		});
}
updateLoop();
 
