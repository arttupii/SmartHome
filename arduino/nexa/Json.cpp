#include"Json.h"
#include "Arduino.h"

char *strrev3(char *str){
    char c, *front, *back;

    if(!str || !*str)
        return str;
    for(front=str,back=str+strlen(str)-1;front < back;front++,back--){
        c=*front;*front=*back;*back=c;
    }
    return str;
}

void longToStr2(char *b, int size, unsigned long long v) {
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
  b = strrev3(b);

  while(b[0]=='0') {
    memcpy(b,&b[1],size);
  }
  if(b[0]==0) {
   b[0]='0';
   b[1]=0;
  }
}

void printDouble( double val, byte precision){
 // prints val with number of decimal places determine by precision
 // precision is a number from 0 to 6 indicating the desired decimial places
 // example: lcdPrintDouble( 3.1415, 2); // prints 3.14 (two decimal places)

 if(val < 0.0){
   Serial.print('-');
   val = -val;
 }

 Serial.print (int(val));  //prints the int part
 if( precision > 0) {
   Serial.print("."); // print the decimal point
   unsigned long frac;
   unsigned long mult = 1;
   byte padding = precision -1;
   while(precision--)
 	mult *=10;

   if(val >= 0)
	frac = (val - int(val)) * mult;
   else
	frac = (int(val)- val ) * mult;
   unsigned long frac1 = frac;
   while( frac1 /= 10 )
	padding--;
   while(  padding--)
	Serial.print("0");
   Serial.print(frac,DEC) ;
 }
}

Json::Json(){
	
};
Json::~Json(){};
void Json::start()	{
	first=true;
	Serial.print("{");	
}

void Json::end()	{
	Serial.println("}");
}

void Json::add(const char* name, double val, int precision){
	addDefault(name);
	printDouble(val,precision);
}

void Json::add(const char* name, float val){
	addDefault(name);
	Serial.print(val);
}
void Json::add(const char* name, bool val){
	addDefault(name);
	Serial.print(val);
}
void Json::add(const char* name, unsigned long long value){
	addDefault(name);
	char buf[50];
	longToStr2(buf, sizeof(buf), value);
	Serial.print(buf);
}

void Json::addDefault(const char *name) {
	if(first==false) {
		printf(",");
	}
	first=false;
	Serial.print("\"");
	Serial.print(name);
	Serial.print("\"");
	Serial.print(",");	
}
