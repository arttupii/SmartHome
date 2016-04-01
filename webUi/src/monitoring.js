var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var datalogger = require('./datalogger.js');
var watermeter = require('./watermeter.js');
var emeter = require('./electricitymeter.js');
var kamstrup = require('./kamstrup');
var ds18b20 = require('ds18b20');

var tempSensors = [];
var electronicMeter;




var data = {};

function updateRecordJson(objName, json){
	if(json!==undefined) {
		_.keys(json).forEach(function(key){
			datalogger.updateRecord(objName, key, json[key]);	
		});
	}
}
function update(){
	var timetamp = new Date().getTime(); //minutes since 1970
	var index = 0;

	datalogger.newRecord(timetamp);
	
	console.info("Read measurements, timetamp=%d",timetamp);
	
	function readWater() {	
		return watermeter.read()//.delay(5000)
		.then(function(value){
			if(value!==undefined) {
				updateRecordJson("waterMeter", value);
			}
		});
	}

	function readDS1820() {
		//read temperature sensors
		return Promise.map(tempSensors, function(id){
			return new Promise(function(resolve) {
				var temp = ds18b20.temperature(id, function(err, value) {
					console.info("Temperature %s ---> %sC", id, value);
					datalogger.updateRecord("ds1820", id, value);
					resolve();
				});
			});
		}).catch(function(err){
			console.error("ERROR: " + err );
		});
	}

	
	function readElectricityMeter() {
		return emeter.read(electronicMeter)
		.then(function(data){
			if(data!==undefined) {
				updateRecordJson("electricityMeter", data);
			}
		});
	}

	function readKamstrup() {
		var json = kamstrup.getData();
		updateRecordJson("kamstrup", json);
	}

	return Promise.all([readWater(), readDS1820(), readElectricityMeter(), readKamstrup()])
	.then(function(){
		datalogger.appendRecordToFile("./data/data.log");
	});
}

Promise.try(function(){
	datalogger.readRecordsFromFile("./data/data.log");
	emeter.initialize(datalogger.getPrev("electricityMeter"));
	watermeter.initialize(datalogger.getPrev("waterMeter"));	
})
.then(function(){
	return new Promise(function(resolve){
		ds18b20.sensors(function(err, ids) {
		  // got sensor IDs ...
		  tempSensors = ids;
		  console.info("Detected temperature sensors: %s", JSON.stringify(ids))
		  resolve();
		});
	});
})
.delay(10000)
.then(function(){
	update();
	setInterval(update, setup.emoncms.updateFrequency);	
});

function initialize(electronic_meter) {
	electronicMeter = electronic_meter;
}

module.exports.initialize = initialize;

