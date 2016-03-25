var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;

var revRecord;

var fixCounter;


function read(electronicMeter)	{
	return electronicMeter.sendCmd("data")
	.then(function(data){
		if(data.counter!==undefined) {
			if(fixCounter===undefined) {
				try{
					fixCounter = revRecord.electricityConsumption.counter;
				} catch(err) {
					console.info("Trying read fore previus electricityConsumption %s", err);
					fixCounter = 0;
				}
				if(fixCounter===undefined) fixCounter = 0;
			}
			
			console.info("electricity --> fixCounter:%s, counter=%s, pulseLength:%s", fixCounter, data.counter, data.pulseLength);
	
			return {"kWh": (1/10000)*(data.counter + fixCounter), "counter": (data.counter + fixCounter), "pulseLength": data.pulseLength, "watt": data.pulseLength/1000};
		} else {
			console.info("error during read electricity_consumption " + JSON.stringify(data));
		}
	});
}


module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
