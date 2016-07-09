#include"BitStream.h"
#include"Arduino.h"
#include"pins_arduino.h"
#include "Json.h"

int inputPin = 2;
int ledPin = 13;

unsigned long timeout = 100000;
Json json;

BitStream stream(8);
#define digitalPinToInterrupt(p)  ((p) == 2 ? 0 : ((p) == 3 ? 1 : 0))
BitStream streamInterrupt(8);
unsigned long downTime = micros();
void pulseHandler() {

  if (digitalRead(inputPin)) {
    unsigned long duration = micros() - downTime;

    if (duration > 70000) {
      streamInterrupt.clear();
    }
    else if (duration > 8000 && duration < 10000) { //8796
      streamInterrupt.clear();
    }
    else if (duration > 1800 && duration < 2100) { //1964
      streamInterrupt.addBit(0);
    }
    else if (duration > 3800 && duration < 4100) { //3920
      streamInterrupt.addBit(1);
    } else {
      streamInterrupt.clear();
    }
  }
  downTime = micros();

  if (streamInterrupt.count() == 37) {
    stream.set(streamInterrupt);
  }

}

void setup() {
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input:
  pinMode(inputPin, INPUT);
  Serial.begin(115200);
  attachInterrupt(digitalPinToInterrupt(inputPin), pulseHandler, CHANGE);
}




void loop() {
  if (stream.ready()) {
    if ( (stream.byte(0) && 0xf0) && 0x90 && stream.byte(4) == 0xF8) {

      int temp = (stream.byte(2) << 4) | (stream.byte(3) >> 4) & 0x0f;
      if (stream.byte(2) & 0x80) temp |= 0xf000;

      json.start();
      json.add("temperature",float(temp)/10);
      json.add("deviceId", stream.byte(1));

      json.addHexStr("debug", stream.p(), 5);

      json.add("time", millis()/1000);
      json.end();

      stream.clear();
    }
  }
}
