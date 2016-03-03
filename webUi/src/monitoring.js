var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var datalogger = require('./datalogger.js');

var chartConfig = JSON.parse(fs.readFileSync("./chartConfig.json"));
var ds18b20 = require('ds18b20');

var tempSensors = [];

var db = {};

var water = {
	"previusHelper":undefined,
	"consumptionCumulative":0
}
var data = {};

function runCmd(cmd) {
	return new Promise(function(resolve, reject){
		var child = exec(cmd, function( error, stdout, stderr) {
		   if ( error != null ) {
				console.log(stderr);
		   }
		   resolve(stdout);
	   });
	});
}

function appendData(dataName, data) {
	if(db[dataName]===undefined) {
		db[dataName] = [];
	}
	db[dataName].push(data);
	datalogger.append("data/"+dataName, data);
}

function update(){
	var timetamp = parseInt(new Date().getTime()/1000/60); //minutes since 1970
	var index = 0;

	console.info("Read measurements, timetamp=%d",timetamp);
	//runCmd('sh ./src/ocrwater.sh')
	Promise.try(function(){return 0.5})
	.then(function(c){
		if(c!==undefined && (!isNaN(c)) && c!=="") {
			water.previusHelper=water.previusHelper==undefined?c:water.previusHelper;
			console.info("current water consumption is %sm^3, water.previusHelper %sm^3", c/10000, water.previusHelper/10000);
			var tmpConsumptionCumulative = water.consumptionCumulative===undefined?0:water.consumptionCumulative;
			console.info("dddddddddd" + tmpConsumptionCumulative);
			if(c>=water.previusHelper) {
				console.info("KKK", water.consumptionCumulative,c,water.previusHelper);
				water.consumptionCumulative+=(c-water.previusHelper)/10000;
			} else {
				water.consumptionCumulative+=(c + (9999-water.previusHelper))/10000;
			}
			water.previusHelper = c;
			var change = water.consumptionCumulative-tmpConsumptionCumulative;
			console.info("water usage cumulative is %sm^3", water.consumptionCumulative, change);
			

			appendData("water_consumption",[timetamp,change,water.consumptionCumulative]);
		}
	})
	.then(function(){
		//read temperature sensors
		return Promise.each(tempSensors, function(id){
			var temp = ds18b20.temperatureSync(id);
			console.info("Temperature %s ---> %sC", id, temp);
			appendData("temp_" + id, [timetamp,temp]);
		});
	})
}

Promise.map(fs.readdirSync('data'), function(dataFile){
	console.info("Read measurements from %s file",dataFile);
	db[dataFile] = datalogger.read("data/" + dataFile);
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



module.exports.getMeasurements = function(req){
	chartConfig.data = db;
	return chartConfig;
};

/*
{
	"data": {
		"data1": [[0,10],[1,13],[2,15],[3,15],[4,10],[5,15],[6,19],[7,16],[8,11]],
		"data2": [[0,14],[1,19],[2,12],[3,19],[4,17],[5,19],[6,13],[7,18],[8,19]],
		"data3": [[0,111],[1,133],[2,165],[3,185],[4,170],[5,157],[6,189],[7,163],[8,191]],
		"data4": [[0,"ma"],[1,"ti"],[2,"ke"],[3,"to"],[4,"pe"],[5,"la"],[6,"su"],[7,"ma"],[8,"ti"]]
	},
	"charts": [
			{
				"title": "K1",
				"series": {
					"1": {
						"y":["data1", "data2"],
						"ylabel": "lämpötila",
						"valueRange": [-40,50]
					},
					"2": {
						"y":["data3"],
						"ylabel": "sähkö",
						"valueRange": [0,300]
					},
					"x":["data4"],
					"xlabel": "paivayse"
				},
				"y":["data1","data3","data2"],
				"x":"data4"
			},
			{
				"title": "K2",
				"series": {
					"1": {
						"y":["data1", "data2"],
						"ylabel": "lämpötila",
						"valueRange": [-40,50]
					},
					"2": {
						"y":["data3"],
						"ylabel": "sähkö",
						"valueRange": [0,300]
					},
					"x":["data4"],
					"xlabel": "paivayse"
				},
				"y":["data1","data3","data2"],
				"x":"data4"
			}
	]
}
*/
