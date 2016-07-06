
var datalogger = require('./datalogger.js');

function update(name, value){
  var date = new Date();

  var data = datalogger.data();


  if(data[name]===undefined) data[name] = {};
  if(data[name].collection===undefined) data[name].collection = {};

  if(data[name].collection.yearly===undefined) data[name].collection.yearly = {reference:value, updated:date.toJSON()};
  if(data[name].collection.monthly===undefined) data[name].collection.monthly = {reference:value, updated:date.toJSON()};
  if(data[name].collection.weekly===undefined) data[name].collection.weekly = {reference:value, updated:date.toJSON()};
  if(data[name].collection.daily===undefined) data[name].collection.daily = {reference:value, updated:date.toJSON()};
  if(data[name].collection.hourly===undefined) data[name].collection.hourly = {reference:value, updated:date.toJSON()};


  function calculate(t) {
    function update() {
      data[name].collection[t].updated = date.toJSON();
      data[name].collection[t].reference = value;
    }
    var updated = new Date(data[name].collection[t].updated);

    if(t==="yearly" && updated.getYear()!==date.getYear()) update();
    if(t==="monthly" && updated.getMonth()!==date.getMonth()) update();
    if(t==="weekly" && date.getDay()===1/*monday*/ && (updated.getDate() !== date.getDate())) update();
    if(t==="daily" && updated.getDay()!==date.getDay()) update();
    if(t==="hourly" && updated.getHours()!==date.getHours()) update();

    return value-data[name].collection[t].reference;
  }

  return {
    "yearly": calculate("yearly"),
    "monthly": calculate("monthly"),
    "weekly": calculate("weekly"),
    "daily": calculate("daily"),
    "hourly": calculate("hourly")
  };
}

module.exports.update = update;
