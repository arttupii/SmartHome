# Nexa Remote Switch control library for Raspberry pi

![](https://raw.githubusercontent.com/arttupii/SmartHome/master/pictures/schematic.png)

```
This library is based on https://github.com/calle-gunnarsson/NexaCtrl   
Example project that uses nexa library: https://github.com/arttupii/SmartHome/tree/master/  
Link to transmitter module: http://www.dx.com/p/433mhz-wireless-transmitter-module-superregeneration-for-arduino-green-149254

var addon = require('nexa');   

//Transmitter module is connected to GPIO6   
//Check pins from http://wiringpi.com/pins/   
addon.nexaInit(6, function() {   
	console.info("Done");   
});  

var controller_id = 1234556;
var device = 0;

//Set nexa module off
addon.nexaOff(controller_id,device, function() {
	console.info("Done");
});


//Set nexa module on
addon.nexaOn(controller_id,device, function() {
	console.info("Done");
});


//pairing
addon.nexaPairing(controller_id,device, function() {
	console.info("Done");
});

//unpairing
addon.nexaUnpairing(controller_id,device, function() {
	console.info("Done");
});
```