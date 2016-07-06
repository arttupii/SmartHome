var _ = require('underscore');
var fs = require('fs');
var config = JSON.parse(fs.readFileSync("./config.json"));
var setup = JSON.parse(fs.readFileSync("./setupfile.json"));
var Promise = require('bluebird');
var exec = require('child_process').exec;
var readline = require('readline');

var recordSave = {};


function updateRecord(objectName, valueName,value) {
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

function saveToFile(fileName) {
	console.info("Update " + fileName + " file");
	fs.writeFileSync(fileName + "_tmp", JSON.stringify(recordSave, 0, "\t"));
}

function getPrev(name){
	return recordSave[name];
}

//mod()
module.exports.readRecordsFromFile = readRecordsFromFile;
module.exports.updateRecord = updateRecord;
module.exports.saveToFile = saveToFile;
module.exports.getPrev = getPrev;
module.exports.data = function() {return recordSave;};
