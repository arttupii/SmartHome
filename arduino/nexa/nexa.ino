#include"NexaCtrl.h"
#include "Arduino.h"

using namespace std;
//*****
const static unsigned long controller_id = 4982814;

const char *statusOk = "{\"status\":\"ok\"}";
const char *statusNOK = "{\"status\":\"nok\"}";

int nexaPin = 3;
int imp_kWh = 10000;

NexaCtrl nexa(nexaPin);

int digCount(int v) {
  int ret = 0;
  while(v!=0) {
    v/=10;

    ret++;
  }
  return ret;
}


unsigned long long getAndUpdateCounter() {
  static unsigned long long u = 0;
  unsigned long long ret;

  do{
    if(TIFR1&(1<<TOV1)) { //TOV1: Timer/Counter1, Overflow Flag
      u++;
      TIFR1 &= ~(1<TOV1);    }
    ret = ((u<<16))|TCNT1; 
  } 
  while(TIFR1&(1<<TOV1));
  return ret;
}

void setup()
{
  //Use timer 1 as counter
  TCNT1 = 0x0;
  TCCR1A = 0x00;
  TIFR1 &= ~(1<TOV1);
  TCCR1B = 0x7; // Turn on the counter, Clock on Rise
  TCCR1C = 0x00;
  TIMSK1 = 0x00;
  
  pinMode(5, INPUT); 
  digitalWrite(5, HIGH);       // turn on pullup resistors

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
  } 
  else {
    nexa.DeviceOff(controller_id, device);
  }

  return statusOk;
}

const char * setDeviceAsDim(const char *str) {
  char command[10];
  int device, dim;
  sscanf (str,"%s %d",command,&device, &dim);

  nexa.DeviceDim(controller_id, device, dim);

  return statusOk;  
}

const char * pairing(const char *str) {
  char command[10];
  int device;
  sscanf (str,"%s %d",command,&device);
  long tick = millis() + 5000;

  while(millis()<tick) {
    nexa.DeviceOn(controller_id, device);
  }

  return statusOk;  
}

const char * getPowerConsumption() {
  unsigned long long t = getAndUpdateCounter();

  char text[50];
  memset(text,0,sizeof(text));
  text[0]='0';

  int i = 0;	
  for(int l=0;l<16;l++) {
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

  while(text[0]=='0' && text[1]!='.') {
    memcpy(text,&text[1],sizeof(text));
  }

  static char ret[100];
  sprintf(ret,"{\"kWh\":%s,\"status\":\"ok\"}", text);

  return ret;  
}

static String str;
void loop()
{
  //update counter as often as possible
  getAndUpdateCounter();
  if (Serial.available() > 0) {
    str = Serial.readStringUntil('\n');
    if(str.indexOf("on ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    } 
    else  if(str.indexOf("off ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    }  
    else if(str.indexOf("dim ")==0) {
      Serial.println(setDeviceAsSwitch(str.c_str()));
    } 
    else if(str.indexOf("pairing ")==0) {
      Serial.println(pairing(str.c_str()));
    } 
    else if(str.indexOf("data")==0) {
      Serial.println(getPowerConsumption());
    } 
    else {
      Serial.println(statusNOK);
    }
  }
}



