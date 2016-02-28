#include"NexaCtrl.h"
#include "Arduino.h"

using namespace std;
//*****
const static unsigned long controller_id = 4982814;

int nexaPin = 2;
int powerConsumptionPin = 3; //Can be 2 or 3
int imp_kWh = 10000;
unsigned long long powerConsuptionPulses = 0;

NexaCtrl nexa(nexaPin);

void powerConsumptionCountInterrupt() {
  powerConsuptionPulses = powerConsuptionPulses + 1;
}


int digCount(int v) {
  int ret = 0;
  while(v!=0) {
    v/=10;

    ret++;
  }
  return ret;
}


void setup()
{
  attachInterrupt(powerConsumptionPin, powerConsumptionCountInterrupt, RISING);

  // start serial port at 9600 bps:
  Serial.begin(57600);  
  Serial.setTimeout(1000);
  sei();
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
  } 
  else {
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

const char * getPowerConsumption() {
  unsigned long long t;
  cli();
  t = powerConsuptionPulses;
  sei();

  char text[50];
  memset(text,0,sizeof(text));
  text[0]='0';

  int i = 0;	
  while(t!=0) {
    char num = (t%10) + '0';
    text[i]=num;
    t/=10;
    i++;
    if(i==digCount(imp_kWh)) {
      text[i]='.';
      i++;
    }
  }
  strrev(text);
  
  return text;  
}

static String str;
void loop()
{
  if (Serial.available() > 0) {
    str = Serial.readStringUntil('\n');
    if(str.indexOf("on ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    } 
    else  if(str.indexOf("off ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    }  
    if(str.indexOf("dim ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    }  
    if(str.indexOf("pairing ")==0) {
      Serial.println(pairing(str.c_str()));
    }  
    if(str.indexOf("getPowerConsumption")==0) {
      Serial.println(getPowerConsumption());
      Serial.println("ok");
    } 
  }
}

