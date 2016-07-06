var Promise = require('bluebird');
var fs = require('fs');

var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var serialport = require("serialport");
var SerialPort = serialport.SerialPort
var usbSPath = require('./usbSerialAbsolutPath');

setup.nexaSerialPort.config.parser = serialport.parsers.readline("\n");
var sp;
var resolvePromise;

if(setup.simulate) {
  sp = {
    write: function(){
      trigNewJob();
    }
  };
} else {
  sp = new SerialPort(usbSPath.getSerialPort(setup.nexaSerialPort.port, "NEXA"), setup.nexaSerialPort.config);


  sp.on('data', function(data) {
    console.log('data received: ' + data);
    if(resolvePromise!==undefined) {
  	  resolvePromise(data);
  	  resolvePromise=undefined;
    }
    trigNewJob();
  });
}

var jobs = [];

function trigNewJob(){
	if(resolvePromise===undefined){
		if(jobs.length>0){
			var job = jobs.pop();
			resolvePromise = job[0];
			job[2].timeout(10000)
			.catch(Promise.TimeoutError, function(e) {resolvePromise
				resolvePromise('{"status":"timeout"}');
				resolvePromise=undefined;
				trigNewJob();
			});
			//console.log('data send: ' + job[1]);
			sp.write(job[1] + "\n", function(err, results) {});
		}
	}
};

function sendCommand(cmd) {
	var r;
	var p = new Promise(function(resolve, revert){
		r = resolve;
	}).then(function(data){
		return JSON.parse(data);
	});

	jobs.push([r, cmd, p]);
	trigNewJob();

	return p;
}


module.exports.sendCmd = sendCommand;
