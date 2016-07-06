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

var collectConsumtionInfo = require('./collectConsumtionInfo');

function updateRecordJson(objName, json){
	if(json!==undefined) {
		_.keys(json).forEach(function(key){
			datalogger.updateRecord(objName, key, json[key]);
		});
		sendToEmoncms(objName, json);
	}
}

function sendToEmoncms(name, restApiObject){
	superagent.parse = function(){};

	var apiRequest = setup.emoncms.server + '/input/post.json?node=' + name + '&json=' + JSON.stringify(restApiObject) + '&apikey=' + setup.emoncms.apikey;
	console.info(apiRequest);

	superagent.get(apiRequest)
	.end(function(err, res){
		console.info("\n\n" + res + err);
	});

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
			}
		});
	}

	function readDS1820() {
		//read temperature sensors
		var json = ds1820.getData();
		updateRecordJson("ds1820", json);
	}


	function readElectricityMeter() {
		return emeter.read(electronicMeter)
		.then(function(data){
			if(data!==undefined) {
				var info = collectConsumtionInfo.update("electricityMeter", value.value);
				updateRecordJson("electricityMeter", _.extend(data, info));
			}
		});
	}

	function readKamstrup() {
		var json = kamstrup.getData();
		updateRecordJson("kamstrup", json);
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
.delay(10000)
.then(function(){
	update();
	setInterval(update, setup.emoncms.updateFrequency);
});

function initialize(electronic_meter) {
	electronicMeter = electronic_meter;
}

module.exports.initialize = initialize;
