var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var revRecord;


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

function read() {
	return runCmd("acpi -t")
	.then(function(t){
		var tmp = {};
		_.chain(t.split("\n"))
		.filter(function(l){
			return l.indexOf("Thermal")!==-1;
		})
		.map(function(l){
			var r = l.replace(":","").split(" ");
		        var ret={};		
			ret[r[0]+r[1]] = r[3];
			return ret;		
		}).each(function(t){
			_.extend(tmp, t);
		});

		return tmp;
	})
}

module.exports.read = read;

