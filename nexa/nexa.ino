#include"NexaCtrl.h"

using namespace std;
//*****
const static unsigned long controller_id = 4982814;

NexaCtrl nexa(2);

void setup()
{
// start serial port at 9600 bps:
  Serial.begin(57600);  
  Serial.setTimeout(1000);
}

int parseInt(String &v) {
  String tmp = "";
  for(int i=0;i<v.length();i++) {
     if(isDigit(v[i])) {
       tmp+=v[i];
     } 
  }
  return tmp.toInt();
}

const char * setDeviceAsSwitch(const char *str) {
  char command[10];
  int device;
  sscanf (str,"%s %d",command,&device);

  if( strcmp("on",command)==0 ) {  
    nexa.DeviceOn(controller_id, device);
  } else {
    nexa.DeviceOff(controller_id, device);
  }
  
  return "ok";
}

const char * setDeviceAsDim(const char *str) {
  char command[10];
  int device, dim;
  sscanf (str,"%s %d",command,&device, &dim);
 
  nexa.DeviceDim(controller_id, device, dim);
  
  return "ok";  
}

const char * pairing(const char *str) {
  char command[10];
  int device;
  sscanf (str,"%s %d",command,&device);
  long tick = millis() + 5000;
  
  while(millis()<tick) {
    nexa.DeviceOn(controller_id, device);
  }
  
  return "ok";  
}

String str;
void loop()
{
  if (Serial.available() > 0) {
   str = Serial.readStringUntil('\n');
   if(str.indexOf("on ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
   } else  if(str.indexOf("off ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
   }  if(str.indexOf("dim ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
   }  if(str.indexOf("pairing ")==0) {
      Serial.println(pairing(str.c_str()));
   }  
 }
}
