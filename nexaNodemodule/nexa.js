var addon = require('bindings')('nexa');

module.exports.nexaInit = addon.nexaInit;
module.exports.nexaOn = addon.nexaOn;
module.exports.nexaOff = addon.nexaOff;
module.exports.nexaDim = addon.nexaDim;
module.exports.nexaPairing = addon.nexaPairing;
module.exports.nexaUnpairing = addon.nexaUnpairing;


process.on('message', function(m) {
    
  if(m.cmd=='nexaInit') {
	  addon.nexaInit(m.gpio);
  }
  if(m.cmd=='nexaOn') {
	  addon.nexaOn(m.controller_id,m.device);
  }
  if(m.cmd=='nexaOff') {
	  addon.nexaOff(m.controller_id,m.device);
  } 
  if(m.cmd=='nexaDim') {
	  addon.nexaOff(m.controller_id,m.device,m.dim);
  } 
  if(m.cmd=='nexaPairing') {
	  addon.nexaPairing(m.controller_id,m.device);
  }
  if(m.cmd=='nexaUnpairing') {
	  addon.nexaUnpairing(m.controller_id,m.device);
  }
  process.send(m);
});

