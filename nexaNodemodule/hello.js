var addon = require('bindings')('nexa');
addon.nexaInit(4);
console.log(addon.nexaOff(4982814,0)); // 'world'

