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

function update(){
	updateThread()
	.delay(10000)
	.then(function(){
		return updateThread();
	})
	.then(function(){
		update();
	});
}
update();


var l;

var updated = false;

var prevM;
function calculateConsumption(m) {
		console.info("calculateConsumption, water --> ",m);
		if(prevM===undefined) {
			prevM = m;
		}
		
		function calculate() {
			var tmp = l;
			if(prevM<=m){
				tmp += m-prevM;		
			} else {
				tmp += m + (999.9-prevM)
			}
			return tmp;
		}
		
		var ret = calculate();

		console.info("calculateConsumption, ret=%s, l=%s, prevM=%s",ret,l,prevM);

		if( ((ret-l)<500) && (ret>=l) ) {
			prevM = m;
			l = ret;
			updated = true;
		}
}

function updateThread() {
		
	return Promise.resolve()
	.then(function(){
		console.info("Start ocr");
		return runCmd('sh ./src/ocrwater.sh');
	})
	.then(function(c){
		if(c!==undefined && (!isNaN(c)) && c!=="") {
			c=parseInt(c);
		
			if(l===undefined || isNaN(l)) {
				try{
					l = revRecord.l;
				} catch(err) {
					console.info("Trying read fore previus waterConsumption %s failed", err);
					l = 0;
				}
				if(isNaN(l)) l = 0;	
			}
			console.info("Water consumption from meter %sl, --> %sl", c/10, l);	
			calculateConsumption(c/10);
		}
	});
}

function read(c){
	var ret;

	if(updated){
		ret = {"l":parseFloat(l).toFixed(1)};
		updated = false;
	}
	return Promise.resolve(ret);
}

module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
