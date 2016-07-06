var fs = require('fs');

var setup = JSON.parse(fs.readFileSync("./setupfile.json"));

var Promise = require('bluebird');
var serialport = require("serialport");
var SerialPort = serialport.SerialPort
var usbSPath = require('./usbSerialAbsolutPath');


var serialSetup = setup.kamstrupSerialPort;

var json;

var resolvePromise;

serialSetup.config.parser = serialport.parsers.readline("\n");
var sp;

if(setup.simulate) {

} else {
	sp = new SerialPort(usbSPath.getSerialPort(serialSetup.port, "kamstrup"), serialSetup.config);
	sp.on('data', function(data) {
		try{
			json = JSON.parse(data);
			json.kWh = json.energy * 1000;
			console.info("kamstrup: " + data);
		} catch(err){
			console.error("kamstrup " + err);
		}
	});
}
	
module.exports.getData = function() {
	var ret = json;
	json = undefined;
	return ret;
};
