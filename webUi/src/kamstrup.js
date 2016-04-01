var fs = require('fs');

var setup = JSON.parse(fs.readFileSync("./setupfile.json"));

var Promise = require('bluebird');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort
var usbSPath = require('./usbSerialAbsolutPath');


var serialSetup = setup.kamstrupSerialPort;

serialSetup.config.parser = serialport.parsers.readline("\n");
var sp = new SerialPort(usbSPath.getSerialPort(serialSetup.port, "kamstrup"), serialSetup.config);

var json;

var resolvePromise;
sp.on('data', function(data) {
	try{
		json = JSON.parse(data);
		json.kWh = json.energy * 1000;
		console.info("kamstrup: " + data);
	} catch(err){
		console.error("kamstrup " + err);
	}
});
	
module.exports.getData = function() {
	return json;
};
