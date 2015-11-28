var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var nexa = require('nexa');

var controller_id = setup.controller_id;

//Tansmitter is connected to GPIO6
nexa.nexaInit(setup.gpioPort);


var deviceId = parseInt(process.argv[3]);
var pair = process.argv[2];

console.info("Pair, deviceId: " + deviceId, " controller_id: " + controller_id);

if(config.devices[deviceId]!==undefined) {
	if(pair==="pair") {
		nexa.nexaPairing(controller_id, deviceId, function() {
			console.info("Done...");
			process.exit(0);
		});
	} else if(pair==="unpair") {
		nexa.nexaUnpairing(controller_id, deviceId, function() {
			console.info("Done...");
			process.exit(0);
		});
	} else {
		console.info("Error.. Invalid arguments");
		process.exit(1);
	}
} else {
	console.info("Error: DeviceId is not existing in config.json");
	process.exit(1);
}
