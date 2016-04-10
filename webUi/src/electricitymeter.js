var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;

var revRecord;

var fixCounter;

var prevkWh;

function read(electronicMeter)	{
	return electronicMeter.sendCmd("data")
	.then(function(data){
		if(data.counter!==undefined) {
			if(fixCounter===undefined) {
				try{
					fixCounter = revRecord.counter;
				} catch(err) {
					console.info("Trying read fore previus electricityConsumption %s", err);
					fixCounter = 0;
				}
				if(fixCounter===undefined) fixCounter = 0;
			}
			console.info(JSON.stringify(revRecord));
			console.info("electricity --> fixCounter:%s, counter=%s, pulseLength:%s", fixCounter, data.counter, data.pulseLength);
			
			var pulseLengthS = data.pulseLength / 1000 / 1000;	

			var watt = (3600/(pulseLengthS*10000))*1000;
			var kWh = (1/10000)*(data.counter + fixCounter);
			if(prevkWh===undefined) {
				prevkWh = kWh;
			}
			var changeWh = (kWh-prevkWh)*1000;
			prevkWh = kWh;

			return {"kWh": kWh, "pulseLength": data.pulseLength, "watt": watt, "Wh": changeWh, "counter": data.counter + fixCounter};
	
		} else {
			console.info("error during read electricity_consumption " + JSON.stringify(data));
		}
	});
}


module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
