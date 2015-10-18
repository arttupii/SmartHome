var SerialPort = require("serialport").SerialPort
var sport = require("serialport")
var Promise = require('bluebird');
var serialPort = new SerialPort("\\\\.\\COM10", {
  baudrate: 57600,
  parser: sport.parsers.readline("\n")
}, true); // this is the openImmediately flag [default is true] 

var open = false;
serialPort.on ('open', function () {
	open = true;
});

var dataCallBack = function(){};

serialPort.on ('data', function( data ) {
	dataCallBack(data);
});

serialPort.on ('close', function( data ) {
	console.info("CLOSE!!");	
});

module.exports.sendCmdAndWaitReply = function(cmd) {
	return new Promise(function(resolve, reject){

		console.info("Send to arduino... cmd=%s", cmd);
		if(open) {
			serialPort.write(cmd, function(err, result){});
			dataCallBack = function(data) {
				dataCallBack = function(){};
				resolve(data);
			}
			//resolve();
		}
		else {
			reject("Serial port is not open");
		}
	}).timeout(2000);
}
