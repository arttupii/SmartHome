var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var revRecord;


var timeHelper;
function getTimeChange() {
	var ret = 0;
	var now = new Date().getTime()
	if(timeHelper!==undefined){	
		ret = now - timeHelper;	
	} 
	timeHelper = now;
		
	return ret;
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

function float2int (value) {
    return value | 0;
}

var meterValue;

var consuptionStarted = false;
function updateThread() {
		
	return Promise.resolve()
	.then(function(){
		console.info("Start ocr");
		return runCmd('sh ./src/ocrwater.sh');
	})
	.then(function(m){
		if(m!==undefined && (!isNaN(m)) && m!=="") {
			m=parseInt(m);
		
			if(meterValue===undefined || isNaN(meterValue)) {
				try{
					meterValue = Math.round(revRecord.value*10);
				} catch(err) {
					console.info("Trying read fore previus waterConsumption %s failed", err);
					meterValue = m;
				}
				if(isNaN(meterValue)) meterValue = m;	
			}
		        
			var prevM = meterValue;
			meterValue = float2int(meterValue/10000)*10000 + m;
			if( Math.abs(meterValue-prevM)>5000) {
				meterValue += 10000;	
			}
			var change = meterValue-prevM;
			if(change<0) change = 0;

			console.info("Water consumption from meter %s", meterValue);

			return {"value":meterValue/10, "change": change/10};
		}
	});
}

function read(){
	return updateThread();
}

module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
