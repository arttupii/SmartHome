var fs = require('fs');

var setup = JSON.parse(fs.readFileSync("./setupfile.json"));

var Promise = require('bluebird');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort
var usbSPath = require('./usbSerialAbsolutPath');


var serialSetup = setup.ds1820SerialPort;

serialSetup.config.parser = serialport.parsers.readline("\n");
var sp = new SerialPort(usbSPath.getSerialPort(serialSetup.port, "ds1820"), serialSetup.config);

var json = {};

var resolvePromise;
sp.on('data', function(data) {
	try{
		var input = JSON.parse(data);
		if(input.address!==undefined && input.temperature!==undefined) {
			json[input.address] = input.temperature;
		}
	} catch(err){
		console.error("ds1820 " + err);
	}
});
	
module.exports.getData = function() {
	return json;
};
