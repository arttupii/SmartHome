var addon = require('bindings')('nexa');
addon.nexaInit(2);
console.log(addon.nexaOn(23,5)); // 'world'