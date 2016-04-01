#include "Arduino.h"
#include "Json.h"
#include <OneWire.h>
#include <DallasTemperature.h>

Json json;

OneWire  ds(10);  // on pin 10
DallasTemperature sensors(&ds);

#define TEMPERATURE_PRECISION 12

void setup(void)
{
	Serial.begin(57600);
	json.start();
	json.add("deviceName","ds1820 reader");
	json.add("status", "started");
	json.end();
}

uint8_t address[8];

//Linux uses this same address format (ds1820 driver)
char *convertAddr(unsigned char *a) {
 char buf[50]; //28-00 00 03 8e 01 5e
 sprintf(buf,"%02x-%02x%02x%02x%02x%02x%02x", a[0],a[6],a[5],a[4],a[3],a[2],a[1]);
 return buf;
}
//   0415a32c80ff3832
//28-04 15 a3 2c 80 ff
void loop(void){
	sensors.begin(); 
	sensors.setResolution( TEMPERATURE_PRECISION);
	
	json.start();
	json.add("sensorCnt", (int)sensors.getDeviceCount());
	json.end();
	
	if(sensors.getDeviceCount()==0) {
	  delay(3000);
	}
	
	for(int i=0;i<sensors.getDeviceCount();i++)	{
		bool ok = sensors.getAddress(address, i);
		ok &= sensors.requestTemperaturesByAddress(address);
		if(ok)	{
		    delay(1000);
		    float temperature = sensors.getTempC(address);				
		    json.start();
		    json.add("address", convertAddr(address));
		    json.add("temperature", temperature);
		    json.end();
		}
	}
}
