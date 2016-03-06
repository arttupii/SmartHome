var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var readline = require('readline');

var record = {};
var records = [];

function updateRecord(objectName, valueName,value) {
	if(record[objectName]===undefined) record[objectName] = {};
	record[objectName][valueName] = value;
}

function readRecordsFromFile(dataFile) {
	try{
		var file = fs.readFileSync(dataFile, 'utf8');
		
		file = file.split("\n");
		records = [];
		
		file.forEach(function(line){
			if(line.length>3) {
				records.push(JSON.parse(line));
			}
		});
	} catch(err) {
		console.error(err);
	}
	return records;
}

function appendRecordToFile(fileName) {
	fs.appendFileSync(fileName, JSON.stringify(record)+"\n",'utf8');
	records.push(JSON.parse(JSON.stringify(record)));
}

function newRecord(timetamp) {
	record={"time":timetamp};
}

function getPrev(){
	if(records.length>=1) {
		return records[records.length-1];
	}
	return undefined;
}

function getRecords(){
	return records;
}

module.exports.readRecordsFromFile = readRecordsFromFile;
module.exports.updateRecord = updateRecord;
module.exports.appendRecordToFile = appendRecordToFile;
module.exports.newRecord = newRecord;
module.exports.getPrev = getPrev;
module.exports.getRecords = getRecords;
