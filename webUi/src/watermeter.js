var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var revRecord;

var water = {
	"previusHelper":undefined,
	"consumptionCumulative":undefined
}


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

function read(c){
	return Promise.resolve();
	
	function tryToGetPicture() {
		var succeed = false;
		
		var tryToGetPromise = Promise.each(_.range(0,10), function() {
			if(succeed) return;
			return runCmd('sh ./src/ocrwater1.sh')
			.then(function(difference) {
				difference = parseFloat(difference.split(" ")[0]);
				if(difference<4000) {
					console.info("Picture succeed " + difference);
					succeed = true;
				} else {
					console.info("Picture failed " + difference);
				}
			});
		})
		return tryToGetPromise;
	}
/*	
	return tryToGetPicture()
	.then(function(){
		console.info("Start ocr");
		return runCmd('sh ./src/ocrwater2.sh');
	})
	.then(function(c){
		if(c!==undefined && (!isNaN(c)) && c!=="") {
			c=parseInt(c);
						
			if(water.consumptionCumulative===undefined || water.previusHelper==undefined) {
				water.previusHelper=c;
				try{
					water.consumptionCumulative = revRecord.waterConsumption.cumulative;
				} catch(err) {
					console.info("Trying read fore previus waterConsumption %s", err);
					water.consumptionCumulative = 0;
				}
				if(water.consumptionCumulative===undefined) water.consumptionCumulative = 0;
				
			}
			
			console.info("current water consumption is %sm^3, water.previusHelper %sm^3, water.consumptionCumulative=%s, c=%s", c/10000, water.previusHelper/10000,water.consumptionCumulative, c);

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
				return {change:change,cumulative:water.consumptionCumulative};
			}
		}
	});*/
}

module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
