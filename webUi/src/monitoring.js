var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var datalogger = require('./datalogger.js');
var watermeter = require('./watermeter.js');
var emeter = require('./electricitymeter.js');

var ds18b20 = require('ds18b20');

var tempSensors = [];
var electronicMeter;




var data = {};


function update(){
	var timetamp = parseInt(new Date().getTime()/1000/60); //minutes since 1970
	var index = 0;

	datalogger.newRecord(timetamp);
	
	console.info("Read measurements, timetamp=%d",timetamp);
	
	return watermeter.read()
	.then(function(value){
		if(value!==undefined) {
			datalogger.updateRecord("waterConsumption", "change", value.change);
			datalogger.updateRecord("waterConsumption", "cumulative", value.cumulative);
		}
	})
	.then(function(){
		//read temperature sensors
		return Promise.each(tempSensors, function(id){
			var temp = ds18b20.temperatureSync(id);
			console.info("Temperature %s ---> %sC", id, temp);
			
			datalogger.updateRecord("temp_" + id, "temperature", temp);
		});
	})
	.then(function() {
		return emeter.read(electronicMeter)
		.then(function(data){
			if(data!==undefined) {
				datalogger.updateRecord("electricityConsumption", "change", data.change);
				datalogger.updateRecord("electricityConsumption", "cumulative", data.cumulative);
			}
		})
	})
	.then(function(){
		datalogger.appendRecordToFile("./data/data.log");
	});
}

Promise.try(function(){
	datalogger.readRecordsFromFile("./data/data.log");
	emeter.initialize(datalogger.getPrev("electricityConsumption"));
	watermeter.initialize(datalogger.getPrev("waterConsumption"));	
})
.then(function(){
		tempSensors;
		return new Promise(function(resolve){
			ds18b20.sensors(function(err, ids) {
			  // got sensor IDs ...
			  tempSensors = ids;
			  console.info("Detected temperature sensors: %s", JSON.stringify(ids))
			  resolve();
			});
		});
})
.then(function(){
	update();
	setInterval(update, 10*60*1000);	
});

function initialize(electronic_meter) {
	electronicMeter = electronic_meter;
}

module.exports.initialize = initialize;
module.exports.getMeasurements = function(req){
	var chartConfig = JSON.parse(fs.readFileSync("./chartConfig.json"));
	chartConfig.data = datalogger.getRecords();
	return chartConfig;
};

