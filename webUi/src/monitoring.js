var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var datalogger = require('./datalogger.js');

var ds18b20 = require('ds18b20');

var tempSensors = [];
var electronicMeter;

var water = {
	"previusHelper":undefined,
	"consumptionCumulative":undefined
}

var electricity = {
	"previusHelper":undefined,
	"consumptionCumulative":undefined
};

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

function update(){
	var timetamp = parseInt(new Date().getTime()/1000/60); //minutes since 1970
	var index = 0;

	datalogger.newRecord(timetamp);
	var revRecord = datalogger.getPrev();
	
	console.info("Read measurements, timetamp=%d",timetamp);
	
	return runCmd('sh ./src/ocrwater.sh')
	//Promise.try(function(){return 3454}).delay(5000)
	.then(function(c){
		if(c!==undefined && (!isNaN(c)) && c!=="") {
			if(water.consumptionCumulative===undefined || water.previusHelper==undefined) {
				water.previusHelper=c;
				try{
					water.consumptionCumulative = revRecord.waterConsumption.cumulative;
				} catch(err) {
					console.info("Trying read fore previus waterConsumption %s", err);
					water.consumptionCumulative = 0;
				}
			}
			console.info("current water consumption is %sm^3, water.previusHelper %sm^3, water.consumptionCumulative=%s", c/10000, water.previusHelper/10000,water.consumptionCumulative);

			var tmpConsumptionCumulative = water.consumptionCumulative;

			if(c>=water.previusHelper) {
				water.consumptionCumulative+=(c-water.previusHelper)/10000;
			} else {
				water.consumptionCumulative+=(c + (9999-water.previusHelper))/10000;
			}
			
			if(isNaN(water.consumptionCumulative)) {
				console.info("Something is wrong!!!. water consumption calculation failes, c=%s, tmpConsumptionCumulative=%s, water=%s", c, tmpConsumptionCumulative, JSON.stringify(water));
				water.consumptionCumulative = tmpConsumptionCumulative;
			} else { 
				water.previusHelper = c;
				var change = water.consumptionCumulative-tmpConsumptionCumulative;
				console.info("water usage cumulative is %sm^3, change=%s", water.consumptionCumulative, change);
				
				datalogger.updateRecord("waterConsumption", "change",change);
				datalogger.updateRecord("waterConsumption", "cumulative",water.consumptionCumulative);
			}
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

				datalogger.updateRecord("electricityConsumption", "change", change);
				datalogger.updateRecord("electricityConsumption", "cumulative", electricity.consumptionCumulative);
			} else {
				console.info("error during read electricity_consumption " + JSON.stringify(data));
			}
		})
	})
	.then(function(){
		datalogger.appendRecordToFile("./data/data.log");
	});
}

Promise.try(function(){
	datalogger.readRecordsFromFile("./data/data.log");
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
