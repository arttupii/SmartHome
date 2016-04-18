var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var readline = require('readline');

var record = {};
var recordSave = {};

var superagent = require('superagent');

function updateRecord(objectName, valueName,value) {
	if(record[objectName]===undefined) record[objectName] = {};
	record[objectName][valueName] = value;

	if(recordSave[objectName]===undefined) recordSave[objectName] = {};
	recordSave[objectName][valueName] = value;
}

function readRecordsFromFile(dataFile) {
	try{
		var file = fs.readFileSync(dataFile + "_tmp", 'utf8');
		recordSave = JSON.parse(file);

	} catch(err) {
		console.error(err);
	}
}

function appendRecordToFile(fileName) {
	console.info("Update " + fileName + " file");
	fs.appendFileSync(fileName, JSON.stringify(record)+"\n",'utf8');
	fs.writeFileSync(fileName + "_tmp", JSON.stringify(recordSave, 0, "\t"));
}

function newRecord(timetamp) {
	record={"time":timetamp};
}

function getPrev(name){
	return recordSave[name];
}

function getRecords(){
	return records;
}

//mod() 
module.exports.readRecordsFromFile = readRecordsFromFile;
module.exports.updateRecord = updateRecord;
module.exports.appendRecordToFile = appendRecordToFile;
module.exports.newRecord = newRecord;
module.exports.getPrev = getPrev;
module.exports.getRecords = getRecords;
