#include"NexaCtrl.h"
#include "Arduino.h"

using namespace std;
//*****
const static unsigned long controller_id = 4982814;

const char *statusOk = "{\"status\":\"ok\"}";
const char *statusNOK = "{\"status\":\"nok\"}";

int nexaPin = 3;

unsigned long pulseLength = 0;

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

const char * pair(const char *str) {
  char command[10];
  int device;
  sscanf (str,"%s %d",command,&device);

  for(int i=0;i<20;i++) {
    nexa.DeviceOn(controller_id, device);
  }

  return statusOk;  
}

const char * unpair(const char *str) {
  char command[10];
  int device;
  sscanf (str,"%s %d",command,&device);

  for(int i=0;i<20;i++){
    nexa.DeviceOff(controller_id, device);
  }

  return statusOk;  
}

char *strrev2(char *str){
    char c, *front, *back;

    if(!str || !*str)
        return str;
    for(front=str,back=str+strlen(str)-1;front < back;front++,back--){
        c=*front;*front=*back;*back=c;
    }
    return str;
}


void longToStr(char *b, int size, unsigned long long v) {
  memset(b,0,size);
  b[0]='0';
  int i=0;
  while(v!=0){
    char num = (v%10) + '0';
    b[i]=num;
    v/=10;
    i++;
    if(i>=size-1) {
	break;
    }
  }
  b = strrev2(b);

  while(b[0]=='0') {
    memcpy(b,&b[1],size);
  }
  if(b[0]==0) {
   b[0]='0';
   b[1]=0;
  }
}
void calculateWatt();
void getPowerConsumption() {
  unsigned long long t = getAndUpdateCounter();

  char text[50];
  
  calculateWatt();

  longToStr(text, sizeof(text), t);

  Serial.print("{\"counter\":");
  Serial.print(text);
  Serial.print(",");

  longToStr(text, sizeof(text), pulseLength);
  Serial.print("\"pulseLength\":");
  Serial.print(text);
  Serial.println(",\"status\":\"ok\"}"); 
}

unsigned long timerMicros;

void resetMicros() {
  timerMicros = micros();
}

unsigned long getMicros() {
  unsigned long t = micros();
  
  if (t >= timerMicros)  {
    return t - timerMicros;
  } else {
    return t + 0xffffffff - timerMicros;
  }
}

void calculateWatt() {
  static char startC = 1;
  static unsigned long long m0;

  if(startC==1) {
     m0 = getAndUpdateCounter();
     startC=2;
     resetMicros();
  } else {
     unsigned long t = getMicros();
     unsigned long long m1 = getAndUpdateCounter();
     pulseLength = t/(m1-m0);
     startC=1;
  }
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
    else if(str.indexOf("pair ")==0) {
      Serial.println(pair(str.c_str()));
    } 
    else if(str.indexOf("unpair ")==0) {
      Serial.println(unpair(str.c_str()));
    } 
    else if(str.indexOf("data")==0) {
      getPowerConsumption();
    } 
    else {
      Serial.println(statusNOK);
    }
  }
}



