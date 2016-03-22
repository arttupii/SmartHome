var _ = require('underscore');
var ds18b20 = require('ds18b20');
var tempSensors = [];

function detect(){
	ds18b20.sensors(function(err, ids) {
		ids.forEach(function(id){
		  	if(tempSensors.indexOf(id)!==-1) {
				//console.info("Already detected " + id);
			} else {
				console.info("New sensor detected " + id);
				tempSensors.push(id);
			}
		});
	});
};


setInterval(detect, 1000);
