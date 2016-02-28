var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;

var dataFile = "./data.json";
var waterConsumptionPrevius;
var waterConsumption;
var data = JSON.parse(fs.readFileSync(dataFile));


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
	var d=new Date();
	var index = 0;
	if(data.data.time===undefined) {
		data.data.time = [[index,d.getTime()]];
	} else {
		index = data.data.time[data.data.time.length-1][0] + 1;
		data.data.time.push([index,d.getTime()]);
	}
	if(waterConsumption===undefined) {
		if(data.data.water_m3!==undefined) {
			waterConsumption = data.data.water_m3[data.data.water_m3.length-1][1];
		} else {
			waterConsumption = 0;
		}
		
	}
	
	console.info("Read measurements, index=%d",index);
	runCmd('sh ./src/ocrwater.sh')
	.then(function(c){
		waterConsumptionPrevius=waterConsumptionPrevius==undefined?c:waterConsumptionPrevius;
		console.info("current water consumption is %sm^3, previus %sm^3", c/10000, waterConsumptionPrevius/10000);
		if(c>=waterConsumptionPrevius) {
			waterConsumption+=(c-waterConsumptionPrevius)/10000;
		} else {
			waterConsumption+=(c + (9999-waterConsumptionPrevius))/10000;
		}
		waterConsumptionPrevius = c;
		console.info("water consumption is %sm^3", waterConsumption);
		
		if(data.data.water_m3===undefined) {
			data.data.water_m3 = [];
		}
		data.data.water_m3.push([index,waterConsumption]);
	})
	.then(function(){
		fs.writeFileSync(dataFile, JSON.stringify(data));
	})
}

update();
setInterval(update, 10*60*1000);

module.exports.getMeasurements = function(){return data};

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