var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var Promise = require('bluebird');
var nexa = require('nexa');
var ns = require('nested-structure');
var toDot = require('to-dot');

var server = express();
server.use(express.static('./public'));

//Tansmitter is connected to GPIO6
nexa.nexaInit(6);

var controller_id = 4982814;

var port = 8080;
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

server.listen(port, function() {
    console.log('server listening on port ' + port);
});

var powerOffChangeDetected=false;

function valueFix(value){
	switch(value) {
		case "true": return true;
		case "false": return false;
		case "": return "";
		default: return isNaN(value)?value:parseFloat(value);
	}
}

server.get('/config', function (req, res) {
	function booleanConvert(str) {
		if(str==="true") return true;
		return false;
	}
		
    if(!_.isEmpty(req.query)) {
		//console.info(JSON.stringify(req.query));

        if(req.query.update!==undefined) {
			var dotNotations = toDot(req.query.update);
			_.keys(dotNotations).forEach(function(dot){
				if(dot.indexOf("dummy")===-1) {
					var value = valueFix(dotNotations[dot]);
					//console.info(dot + " " + value);
					ns(config).set(dot, value);
					if(dot.indexOf("powerOn")!==-1) {
						console.info("Power state is updated by user. %s=%s", dot, value);
						powerOffChangeDetected = true;
					}

				}
			});
			fs.writeFileSync("./config.json", JSON.stringify(config,0,4));
		}
    }
    res.send(config);
});
			
function sendPortStatesToTarget() {
	return Promise.each(_.values(config.devices), function (device){
		//console.info(JSON.stringify(device))
		for(var i=0;i<3;i++) {
			if(device.powerOn) {
				if(device.dim>0) {
					  nexa.nexaDim(controller_id, device.id,device.dim);
					return serialPortCmd("dim " + device.id + " " + device.dim + "\n");
				} else {
					nexa.nexaOn(controller_id, device.id);
				}
			} else {
				nexa.nexaOff(controller_id, device.id);;
			}
		}
	}).catch(function (err){
		//console.info("KAKKA")
		console.error(err);
	});
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
		
		function updatePowerOffState(device, state) {
			console.info("Update power state to %s (timer), device=%d", state, device.id);
			device.powerOn = state; 
			powerOffChangeDetected=true;
			fs.writeFileSync("./config.json", JSON.stringify(config,0,4));
		}
		
		return Promise.each(_.values(config.devices), function (device){
			var isTimeOn = isNow(device.event.timeOn);
			var isTimeOff = isNow(device.event.timeOff);
			
			if( isTimeOn && device.powerOn===false || isTimeOff && device.powerOn===true ) {
				var setPowerOn = true;
				if(isTimeOff) setPowerOn = false;
				
				if(device.event.repeatingEvent.ma || device.event.repeatingEvent.tu || 
				device.event.repeatingEvent.we || device.event.repeatingEvent.th || 
				device.event.repeatingEvent.fr || device.event.repeatingEvent.sa  || 
				device.event.repeatingEvent.su ) {
					var now = new Date();
					switch(now.getDay()) {
						case 0: if(device.event.repeatingEvent.su) {updatePowerOffState(device, setPowerOn);} break;
						case 1: if(device.event.repeatingEvent.mo) {updatePowerOffState(device, setPowerOn);} break;
						case 2: if(device.event.repeatingEvent.tu) {updatePowerOffState(device, setPowerOn);} break;
						case 3: if(device.event.repeatingEvent.we) {updatePowerOffState(device, setPowerOn);} break;
						case 4: if(device.event.repeatingEvent.th) {updatePowerOffState(device, setPowerOn);} break;
						case 5: if(device.event.repeatingEvent.fr) {updatePowerOffState(device, setPowerOn);} break;
						case 6: if(device.event.repeatingEvent.sa) {updatePowerOffState(device, setPowerOn);} break;
					}	
				} else {
					if(isTimeOn) device.event.timeOn = "";
					if(isTimeOff) device.event.timeOff = "";
					updatePowerOffState(device, setPowerOn);
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
			if(updaloopCnt>=60 || powerOffChangeDetected) {
				powerOffChangeDetected = false;
				updaloopCnt = 0;
				return sendPortStatesToTarget();
			}
			return Promise.resolve();
		})
		.then(function(){
			return updateLoop();
		});
}
updateLoop();
 
