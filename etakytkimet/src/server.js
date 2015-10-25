var _ = require('underscore');
var express = require('express');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));


//var SerialPort = require("serialport").SerialPort
//var arduino = require("./arduino"); 
var Promise = require('bluebird');
var nexa = require('nexa');

var server = express();
server.use(express.static('./public'));
nexa.nexaInit(6);

var port = 8080;
/*
var serialPort = new SerialPort("\\\\.\\COM10"/"/dev/tty-usbserial1", {
  baudrate: 57600,
  parser: serialport.parsers.readline("\n")
}, true); // this is the openImmediately flag [default is true] 
 */

server.listen(port, function() {
    console.log('server listening on port ' + port);
});

var powerOffChangeDetected=false;

server.get('/config', function (req, res) {
	function booleanConvert(str) {
		if(str==="true") return true;
		return false;
	}
    if(!_.isEmpty(req.query)) {
		console.info(JSON.stringify(req.query));

        if(req.query.update!==undefined) {
			for(var i=0;i<config.length;i++){
				if(parseInt(config[i].id)===parseInt(req.query.update.id)) {
					if(config[i].powerOn !== booleanConvert(req.query.update.powerOn)) {
						powerOffChangeDetected = true;
					}
					config[i].powerOn = booleanConvert(req.query.update.powerOn);
					config[i].event.timeOn = req.query.update.event.timeOn;
					config[i].event.timeOff = req.query.update.event.timeOff;
					config[i].event.repeatingEvent.ma = booleanConvert(req.query.update.event.repeatingEvent.ma);
					config[i].event.repeatingEvent.tu = booleanConvert(req.query.update.event.repeatingEvent.tu);
					config[i].event.repeatingEvent.we = booleanConvert(req.query.update.event.repeatingEvent.we);
					config[i].event.repeatingEvent.th = booleanConvert(req.query.update.event.repeatingEvent.th);
					config[i].event.repeatingEvent.fr = booleanConvert(req.query.update.event.repeatingEvent.fr);
					config[i].event.repeatingEvent.sa = booleanConvert(req.query.update.event.repeatingEvent.sa);
					config[i].event.repeatingEvent.su = booleanConvert(req.query.update.event.repeatingEvent.su);
				}
				
			};
			fs.writeFileSync("./config.json", JSON.stringify(config,0,4));
		}
    }
    res.send(config);
});

/*
	{
		"id": 0,
		"name": "Auton lämmitin",
		"powerOn": 0,
		"dim": 0,
		"event": {
			"timeOn": "",
			"timeOff": "",
			"repeatingEvent": {
				"ma": false,
				"tu": false,
				"we": false,
				"th": false,
				"sa": false,
				"su": false
			}
		}
	},	
*/
var serialportOpen= true;
				
function sendPortStatesToTarget() {
	function serialPortCmd(cmd) {
		//return arduino.sendCmdAndWaitReply(cmd);
	}
	
	function isNow(timeStr) {
		var now = new Date();
		var t = timeStr.split(":");
		var ret = parseInt(t[0]) === now.getHours() && parseInt(t[1]) === now.getMinutes();
		//console.info("isNow(), %d:%d <--> %d:%d   --> ret=%d", t[0], t[1], now.getHours(), now.getMinutes(), ret);
	}
	return Promise.each(config, function (device){
		//console.info("total %s, device%s", total, device);
		if(isNow(device.event.timeOn)) {
			if(device.event.repeatingEvent.ma || device.event.repeatingEvent.tu || 
			device.event.repeatingEvent.we || device.event.repeatingEvent.th || 
			device.event.repeatingEvent.fr || device.event.repeatingEvent.sa  || 
			device.event.repeatingEvent.su ) {
				var now = new Date();
				switch(now.getDay()) {
					case 0: if(device.event.repeatingEvent.su) {device.powerOn = true;} break;
					case 1: if(device.event.repeatingEvent.mo) {device.powerOn = true;} break;
					case 2: if(device.event.repeatingEvent.tu) {device.powerOn = true;} break;
					case 3: if(device.event.repeatingEvent.we) {device.powerOn = true;} break;
					case 4: if(device.event.repeatingEvent.th) {device.powerOn = true;} break;
					case 5: if(device.event.repeatingEvent.fr) {device.powerOn = true;} break;
					case 6: if(device.event.repeatingEvent.sa) {device.powerOn = true;} break;
				}	
			} else {
				device.event.timeOn = "";
				device.powerOn = true;
			}
		}
		
		if(device.powerOn) {
			if(device.dim>0) {
			      nexa.nexaDim(4982814, device.id,device.dim);
				return serialPortCmd("dim " + device.id + " " + device.dim + "\n");
			} else {
				nexa.nexaOn(4982814, device.id);
			}
		} else {
			nexa.nexaOff(4982814, device.id);;
		}
	}).catch(function (err){
		console.error(err);
	});
}

var updaloopCnt=1;
function updateLoop() {
	return Promise.delay(1000)
		.then(function(){
			updaloopCnt++;
			if(updaloopCnt>=30 || powerOffChangeDetected) {
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
 
