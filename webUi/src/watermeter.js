var _ = require('underscore');
var fs = require('fs');
var mailer = require('./mailer.js')

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
				console.info("Last meter value readed from file. " + meterValue);
			}

			var prevM = meterValue;
			meterValue = float2int(meterValue/10000)*10000 + m;
			if( Math.abs(meterValue-prevM)>5000) {
				meterValue += 10000;
			}
			var change = meterValue-prevM;
			if(change<0) change = 0;

                        if(Math.abs(meterValue-prevM)<5) {
                            if(prevM>meterValue) {
                                meterValue=prevM;
                            }
                        }

			console.info("Water consumption from meter %s", meterValue);

			var ret = {"value":meterValue/10, "change": change/10};

			detectWaterLeakAndWarn(ret);

			return ret;
		}
	});
}

function detectWaterLeakAndWarn(meter) {
	var myself = this;
	var now = new Date().getTime();
	var leakingDetectingTime = setup.waterLeakingDetect.leakingDetectingTime;
	var minimumWaterNotUsedTime = setup.waterLeakingDetect.resetTime;
  var maxWaterConsumptionLiter = setup.waterLeakingDetect.maxWaterConsumptionLiter;
	function timeS(t) {
		if(t===undefined) return 0;
			return (now-t)/1000;
	}

	meter = JSON.parse(JSON.stringify(meter));
	if(myself.watermeterArray===undefined) {
		myself.watermeterArray = [];
	}
	meter.timestamp = now;
	myself.watermeterArray.push(meter);

	var analysingArrayIsFull = false;
	//remove old records
  while(myself.watermeterArray.length>=1 && (timeS(myself.watermeterArray[0].timestamp) >= leakingDetectingTime)) {
		myself.watermeterArray.splice(0,1);
		analysingArrayIsFull = true;
	}

	function maxWaterConsumption() {
		var waterConsumption = myself.watermeterArray[myself.watermeterArray.length-1].value-myself.watermeterArray[0].value;
		var timeRange = timeS(myself.watermeterArray[0].timestamp);

		console.info("DetectWaterLeak: Water consuption is %s, timeRange: %s", waterConsumption, timeRange);

		if(myself.watermeterArray[0].consumtionWarning!==true &&
			waterConsumption>=maxWaterConsumptionLiter) {

			myself.watermeterArray.forEach(function(m){
				m.consumtionWarning = true;
			});

			console.info("Water consumtion warning!!!!!");
			mailer.sendMail("Water consumtion Warning!!!", JSON.stringify({
				leakingDetectingTime: setup.waterLeakingDetect.leakingDetectingTime,
				change: waterConsumption,
				maxWaterConsumptionLiter: maxWaterConsumptionLiter,
				meterValue0: myself.watermeterArray[0].value,
				meterValue1: myself.watermeterArray[myself.watermeterArray.length-1]
			},0,3));
		}
	 }

	function waterLeak() {
		var waterNotUsedLongestTime = 0;
		var timeRange = timeS(myself.watermeterArray[0].timestamp);
		var change = myself.watermeterArray[myself.watermeterArray.length-1].value-myself.watermeterArray[0].value;

		for(var i=0;i<myself.watermeterArray.length;i++) {
			var m0=myself.watermeterArray[i];
			for(var x=i;x<myself.watermeterArray.length;x++) {
				var m1=myself.watermeterArray[x];
				if(m0.value===m1.value) {
				 var t = (m1.timestamp - m0.timestamp)/1000;
				 if(t>waterNotUsedLongestTime) {
					 waterNotUsedLongestTime = t;
				 }
				} else {
					break;
				}
			}
		}
		console.info("Longest not used water time is %ss, timerange: ", waterNotUsedLongestTime, timeRange);

		if(myself.watermeterArray[myself.watermeterArray.length-1].value!==myself.watermeterArray[0].value) {
			if(waterNotUsedLongestTime<=minimumWaterNotUsedTime &&
				myself.watermeterArray[0].leakWarning!==true && analysingArrayIsFull) {
				myself.watermeterArray.forEach(function(m){
					m.leakWarning = true;
				});

				console.info("Water leak detected!!!!! change: %s, measurementTime: %s",  change, timeRange);
				mailer.sendMail("Water leak detected!!!", JSON.stringify({
					leakingDetectingTime: setup.waterLeakingDetect.leakingDetectingTime,
					change: change,
					timeRange: timeRange
				},0,3));
			}
		}
	}
	maxWaterConsumption();
	waterLeak();
}


function read(){
	return updateThread();
}

module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
