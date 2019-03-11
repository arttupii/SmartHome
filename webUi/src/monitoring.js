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
var ds1820 = require('./ds1820');
var serverInfo = require('./serverInfo');
var tempSensors = [];
var electronicMeter;
var superagent = require('superagent');
var domoticz = require('./domoticz');

var collectConsumtionInfo = require('./collectConsumtionInfo');

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


	console.info("Read measurements, timetamp=%d",timetamp);

	function readWater() {
		return watermeter.read()//.delay(5000)
		.then(function(value){
			if(value!==undefined) {
				var info = collectConsumtionInfo.update("waterMeter", value.value);
				updateRecordJson("waterMeter", _.extend(value, info));
				domoticz.updateWaterflow("waterMeterLPerMin", value.lPerMin);
				domoticz.updateManagedCounter("waterMeterValue", value.value);
				domoticz.updateWaterChance("waterChange",  value.change);
				
			}
		});
	}

	function readDS1820() {
		//read temperature sensors
		var json = ds1820.getData();
		updateRecordJson("ds1820", json);
		_.keys(json).forEach(function(key){
			domoticz.updateTemp(key, json[key]);
		});
	}


	function readElectricityMeter() {
		return emeter.read(electronicMeter)
		.then(function(data){
			if(data!==undefined) {
				var info = collectConsumtionInfo.update("electricityMeter", data.kWh);
				updateRecordJson("electricityMeter", _.extend(data, info));
				domoticz.updateElectricity("electricityMeter",data.watt, data.kWh);

			}
		});
	}

	function readKamstrup() {
		var json = kamstrup.getData();
		if(json) {
			updateRecordJson("kamstrup", json);
			
			//domoticz.updateTemp("kamstrup_energy",json.energy
			domoticz.updateTemp("kamstrup_temperatureT1", json.temperatureT1);
			domoticz.updateTemp("kamstrup_temperatureT2", json.temperatureT2);
			domoticz.updateTemp("kamstrup_temperatureDiff", json.temperatureDiff);
			domoticz.updateWaterflow("kamstrup_flow", json.flow/60);
			domoticz.updateManagedCounter("kamstrup_volumen1",json.volumen1);
			domoticz.updateElectricity("kamstrup_kWh",json.currentPower*1000, json.kWh);
		}
	}

	function readServerInfo() {
		return serverInfo.read()
		.then(function(data){
			if(data!==undefined) {
				updateRecordJson("serverInfo", data);
			}
		});
	}

	return Promise.all([readWater(), readDS1820(), readElectricityMeter(), readKamstrup(), readServerInfo()])
	.then(function(){
		datalogger.saveToFile("./data/data.log");
	});
}

Promise.try(function(){
	datalogger.readRecordsFromFile("./data/data.log");
	emeter.initialize(datalogger.data()["electricityMeter"]);
	watermeter.initialize(datalogger.data()["waterMeter"]);
})
.delay(60000)
.then(function(){
	update();
	setInterval(update, setup.emoncms.updateFrequency);
});

function initialize(electronic_meter) {
	electronicMeter = electronic_meter;
}

module.exports.initialize = initialize;
