var callbackMap = {};
var callbackCounter = 1;

var cp = require('child_process');
var n = cp.fork(__dirname + '/nexa.js');

n.on('message', function(m) {
  if(callbackMap[m.callbackCounter]!==undefined) {
	  callbackMap[m.callbackCounter]();
	  delete callbackMap[m.callbackCounter];
  }
});

function nexaInit(gpio, cb){
	n.send({ cmd: 'nexaInit', gpio:gpio, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;
}

function nexaOn(controller_id,device, cb){
	n.send({ cmd: 'nexaOn', controller_id:controller_id,device:device, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;	
}

function nexaOff(controller_id,device, cb){
	n.send({ cmd: 'nexaOff', controller_id:controller_id,device:device, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;		
}

function nexaDim(controller_id,device, dim, cb){
	n.send({ cmd: 'nexaDim', controller_id:controller_id,device:device, dim:dim, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;		
}

function nexaPairing(controller_id,device, cb){
	n.send({ cmd: 'nexaPairing', controller_id:controller_id,device:device, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;		
}

function nexaUnpairing(controller_id,device, cb){
	n.send({ cmd: 'nexaUnpairing', controller_id:controller_id,device:device, callbackCounter: callbackCounter});
	callbackMap[callbackCounter] = cb;
	callbackCounter = callbackCounter + 1;		
}

module.exports.nexaInit = nexaInit;
module.exports.nexaOn = nexaOn;
module.exports.nexaOff = nexaOff;
module.exports.nexaDim = nexaDim;
module.exports.nexaPairing = nexaPairing;
module.exports.nexaUnpairing = nexaUnpairing;
