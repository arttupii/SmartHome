var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var nexa = require('nexa');

var controller_id = setup.controller_id;

//Tansmitter is connected to GPIO6
nexa.nexaInit(setup.gpioPort);

Promise.each(_.values(config.devices), function (device){
	return new Promise(function (resolve, reject)  {
		nexa.nexaUnpairing(controller_id, device.id, function() {
			resolve();
		});
	});
}).then(function() {
	console.info("Done");
});