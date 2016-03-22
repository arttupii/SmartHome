var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var child_process = require('child_process');

function runCmd(cmd) {
	return child_process.execSync(cmd).toString();;
}


function getSerialPort(pathFind) {
	var retValue;
	runCmd("ls -l /sys/bus/usb-serial/devices/").split("\n")
	.forEach(function(line){
		if(line.indexOf("total")===-1 && line.length>10){
			line = line.split(" -> ");
			var left = line[0].split(" ");
			var rigth = line[1];

			var usbDevice = left[left.length-1];
			var path = rigth;

			if(path.indexOf(pathFind)!==-1) {
				retValue = "/dev/" + usbDevice;
			}
		}
	});

	console.info("pathFind=%s --> usbDevice=%s", pathFind, retValue);
	return retValue;
}

module.exports.getSerialPort = getSerialPort;
