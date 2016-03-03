var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var readline = require('readline');


function append(dataFile, data) {
	var tmp="";
	
	data.forEach(function(d){
		tmp+=d+";";
	});
	
	fs.appendFileSync(dataFile, tmp.substr(0,tmp.length-1)+"\n",'utf8');
}

function read(dataFile) {
	var file = fs.readFileSync(dataFile, 'utf8');

	file = file.split("\n");
	var ret = [];

	file.forEach(function(line){
		var s = line.split(";");
		if(s.length>=2) {
			ret.push(_.map(s,function(v){return parseFloat(v)}));
		}
	});
	return ret;
}

module.exports.append = append;
module.exports.read = read;
