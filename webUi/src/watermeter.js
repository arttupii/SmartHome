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

	if(meter.change>0) {
		if(waterUsingStartedTime===undefined) {
			this.waterUsingStartedTime = now;
			this.meterValue = meter.value;
		}
		this.waterNotUsedTime = now;
	} else {
		if(this.waterNotUsedTime===undefined) {
			this.waterNotUsedTime = now;
		}
	}
  if(this.meterValue === undefined ) {
		this.meterValue = meter.value;
	}

	console.info("waterUsingStartedTime %s, waterNotUsedTime =%s ", timeS(this.waterUsingStartedTime), timeS(this.waterNotUsedTime));
	if(timeS(this.waterNotUsedTime)>minimumWaterNotUsedTime) {
		this.waterUsingStartedTime = undefined;
		this.meterValue = meter.value;
	}

	if(meter.value-this.meterValue>maxWaterConsumptionLiter) {
		console.info("Water consumtion warning!!!!! change: %s, measurementTime: %s",  meter.value - this.meterValue, setup.waterLeakingDetect.leakingDetectingTime);
		mailer.sendMail("Water consumtion Warning!!!", JSON.stringify({
			leakingDetectingTime: setup.waterLeakingDetect.leakingDetectingTime,
			change: meter.value - myself.meterValue,
			maxWaterConsumptionLiter: maxWaterConsumptionLiter,
			meterValue0: myself.meterValue,
			meterValue1: meter.value
		},0,3));
		this.waterUsingStartedTime = undefined;
		this.meterValue = meter.value;
	}

	if(timeS(this.waterUsingStartedTime)>leakingDetectingTime || true) {
			console.info("Water leak detected!!!!! change: %s, measurementTime: %s",  meter.value - this.meterValue, setup.waterLeakingDetect.leakingDetectingTime);
			mailer.sendMail("Water leak detected!!!", JSON.stringify({
				leakingDetectingTime: setup.waterLeakingDetect.leakingDetectingTime,
				change: meter.value - myself.meterValue,
				meterValue0: myself.meterValue,
				meterValue1: meter.value
			},0,3));
			this.waterUsingStartedTime = undefined;
			this.meterValue = meter.value;
	}
}


function read(){
	return updateThread();
}

module.exports.read = read;
module.exports.initialize = function(rev_Record) {
	revRecord = rev_Record;
}
