var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;


var revRecord;

var electricity = {
	"previusHelper":undefined,
	"consumptionCumulative":undefined
};

function read(electronicMeter)	{
	return electronicMeter.sendCmd("data")
	.then(function(data){
		if(data.kWh!==undefined) {
			if(electricity.consumptionCumulative===undefined || electricity.previusHelper==undefined) {
				electricity.previusHelper=data.kWh;
				
				try{
					electricity.consumptionCumulative = revRecord.electricityConsumption.cumulative;
				} catch(err) {
					console.info("Trying read fore previus electricityConsumption %s", err);
					electricity.consumptionCumulative = 0;
				}
			}
			var change = data.kWh-electricity.previusHelper;
			electricity.previusHelper = data.kWh;

			electricity.consumptionCumulative += change; 
			
			console.info("electricity usage cumulative is %skWh, change=%skWh, measured=%s", electricity.consumptionCumulative, change, data.kWh);
	
			return {"change":change, "cumulative": electricity.consumptionCumulative};
		} else {
			console.info("error during read electricity_consumption " + JSON.stringify(data));
		}
	});
}


module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
