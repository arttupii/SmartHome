/*
emonTX V2 Temperature and power pulse + Read of Kamstrup Multical 601 Heat meter

 An example sketch for the emontx module V2 for electricity pulse counting,

 Part of the openenergymonitor.org project
 Licence: GNU GPL V3

 Authors: Glyn Hudson, Trystan Lea

 Kamstrup Multical 601 readout by Bo Herrmannsen, Nicolai Kildal, Mads Chr. Olesen

 Kamstrup values => Emontx variables by Robert Wall

 Builds upon JeeLabs RF12 library and Arduino

 emonTx documentation: 	http://openenergymonitor.org/emon/modules/emontx/
 emonTx firmware code explination: http://openenergymonitor.org/emon/modules/emontx/firmware
 emonTx calibration instructions: http://openenergymonitor.org/emon/modules/emontx/firmware/calibration

 THIS SKETCH REQUIRES:

 Libraries in the standard arduino libraries folder:
 	- JeeLib		https://github.com/jcw/jeelib
 	- EmonLib		https://github.com/openenergymonitor/EmonLib.git

 Other files in project directory (should appear in the arduino tabs above)
 	- emontx_lib.ino

 ------------------------------------------------------------------------------------------------------------
 -ID-	-Node Type-
 0	- Special allocation in JeeLib RFM12 driver - reserved for OOK use
 1-4     - Control nodes
 5-10	- Energy monitoring nodes
 11-14	--Un-assigned --
 15-16	- Base Station & logging nodes
 17-30	- Environmental sensing nodes (temperature humidity etc.)
 31	- Special allocation in JeeLib RFM12 driver - Node31 can communicate with nodes on any network group
 -------------------------------------------------------------------------------------------------------------

 */

//********************************************Kamstrup Stuff Start********************************************
#include <SoftwareSerial.h>

float kamReadReg(unsigned short kreg);
void kamSend(byte const *msg, int msgsize);
float kamDecode(unsigned short const kreg, byte const *msg);
unsigned short kamReceive(byte recvmsg[]);
long crc_1021(byte const *inmsg, unsigned int len);

//Kamstrup setup
// Kamstrup Multical 601
word const kregnums[] = {
  0x003C, 0x0050, 0x0056, 0x0057, 0x0059, 0x004a, 0x0044
};                                                   // The registers we want to get out of the meter

#define NUMREGS 7                                                                                                               // Number of registers above
#define KAMBAUD 1200                                                                                                            // The meter's IR runs only at 1200/2400 BAUD

//********************************************Kamstrup Stuff End********************************************

#define RF_freq RF12_868MHZ                                                                                                     // Frequency of RF12B module can be RF12_433MHZ, RF12_868MHZ or RF12_915MHZ. You should use the one matching the module you have.
const int nodeID = 5;                                                                                                          // emonTx RFM12B node ID
const int networkGroup = 210;                                                                                                   // emonTx RFM12B wireless network group - needs to be same as emonBase and emonGLCD

const int UNO = 1;                                                                                                              // Set to 0 if your not using the UNO bootloader (i.e using Duemilanove) - All Atmega's shipped from OpenEnergyMonitor come with Arduino Uno bootloader


#define RF69_COMPAT 0                                                                                                           // set to 1 to use RFM69CW 

//********************************************Kamstrup Stuff Start********************************************
// Pin definitions
#define PIN_KAMSER_RX  8                                                                                                        // Kamstrup IR interface RX --- CORRECT THIS ONE <<<<<<<<<<<<<<<<<<<<<<<<<<
#define PIN_KAMSER_TX  7                                                                                                        // Kamstrup IR interface TX --- CORRECT THIS ONE <<<<<<<<<<<<<<<<<<<<<<<<<<
//********************************************Kamstrup Stuff End********************************************


typedef struct {
  //********************************************Kamstrup Stuff Start********************************************

  float Energy;
  float CurrentPower;
  float TemperatureT1;
  float TemperatureT2;
  float TemperatureDiff;
  float Flow;
  float Volumen1;

  //********************************************Kamstrup Stuff End ********************************************

}
Payload;
Payload emontx;

const int LEDpin = 9;

// Pulse counting settings
long pulseCount = 0;                                                                                                            // Number of pulses, used to measure energy.
unsigned long pulseTime, lastTime;                                                                                              // Used to measure power.
double power, elapsedWh;                                                                                                        // power and energy
int ppwh = 10;                                                                                                                  // 1000 pulses/kwh = 1 pulse per wh - Number of pulses per wh - found or set on the meter.

//********************************************Kamstrup Stuff Start********************************************
// Kamstrup optical IR serial

#define KAMTIMEOUT 2000                                                                                                         // Kamstrup timeout after transmit
#define POLLINTERVAL 15000                                                                                                      // Polling interval  <<<<<<<<<<<<<<<<<< This one both controls when to poll heat meter and when to send data to EmonBase/CMS

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


boolean triggered;

ISR (ANALOG_COMP_vect)
  {
  triggered = true;
  }
  
class SerialS {
  public:
    SerialS(int rx, int tx, bool inverted) {
      pin_tx = tx;
      pin_rx = rx;
      ready = false;

      invertedTx = false;
      invertedRx = true;
      pinMode(13, OUTPUT);
      pinMode(3, INPUT);
      pinMode(tx, OUTPUT);
 
      digWrite(HIGH);
      pinMode(A0, INPUT);
      pinMode(A1, INPUT);
      ADCSRB = 0;           // (Disable) ACME: Analog Comparator Multiplexer Enable
      ACSR = 0;
    }
    ~SerialS() {};
    void begin(unsigned long baud) {
      us = 833;
      //Serial.println(us);
    }


    int available() {
      if (!digRead()) {
        resetMicros();
        unsigned long u = getMicros();

        //start bit
        u += us;
        while (getMicros() <= u);


        for (int i = 0; i < 8; i++) {
          u += us / 2;
          while (getMicros() < u);

          if (digRead()) buf = (buf >> 1) | 0x80;
          else buf = (buf >> 1) & 0x7f;

          u += us / 2;
          while (getMicros() < u);
        }
        ready = true;
        return 1;
      }
      else {
        return 0;
      }
    }
    
    void flush() {
      ready = false;
    }
    
    void write(int d) {
      resetMicros();
      unsigned long u = getMicros() + us;
     
      //start bit;
      digWrite(LOW);
      while (getMicros() <= u);

      for (int i = 0; i < 8; i++) {
        if (d & 1) digWrite(HIGH);
        else digWrite(LOW);
        d = d >> 1;
        u += us;
        while (getMicros() <= u);
      }
      
      digWrite(HIGH);
      //two stop bits
      for (int i = 0; i < 2; i++) {
        u += us;
        while (getMicros() <= u);
      }
    }

    int read() {
      if (ready) {
        ready = false;
        //Serial.print('R');
        //Serial.println(buf);
        return buf;
      }
      available();
      return -1;
    }
  private:
    int digRead() {
     // return digitalRead(3);
      
      int ret;
      ret = (ACSR&(1<<ACO))==0;
      digitalWrite(13, ret?LOW:HIGH);
      return ret;
    }
    void digWrite(int v) {
      digitalWrite(pin_tx, !v);
    }

    unsigned char buf;
    bool ready;
    int pin_tx;
    int pin_rx;
    int invertedTx;
    int invertedRx;
    unsigned long us;
};

SerialS kamSer(10, 8, true);                                                                     // Initialize serial

//SoftwareSerial kamSer2(PIN_KAMSER_RX, 11, true);                                                                     // Initialize serial

//********************************************Kamstrup Stuff End********************************************

void setup() {
  Serial.begin(57600);
  
  //********************************************Kamstrup Stuff Start********************************************
  // setup kamstrup serial
  //pinMode(PIN_KAMSER_RX,INPUT);
  //pinMode(PIN_KAMSER_TX,OUTPUT);
  kamSer.begin(KAMBAUD);

//while(1){
//  Serial.println(kamSer.read());
//}
  Serial.println("{\"Kamstrup\":\"602\"}");
  //kamSer2.begin(9600);
  //kamSer.print("a");
  //********************************************Kamstrup Stuff End********************************************
}

void loop()
{

  //********************************************Kamstrup Stuff Start********************************************
  // check if it is time to do a poll

  // poll the Kamstrup registers for data
 for (int kreg = 0; kreg < NUMREGS; kreg++) {
    kamReadReg(kreg);
    delay(100);
 }

  //********************************************Kamstrup Stuff End********************************************
  Serial.print("{");
  Serial.print("\"energy\":");
  Serial.print(emontx.Energy);
  Serial.print(", ");

  Serial.print("\"currentPower\": ");
  Serial.print(emontx.CurrentPower);
  Serial.print(", ");

  Serial.print("\"temperatureT1\": ");
  Serial.print(emontx.TemperatureT1);
  Serial.print(", ");

  Serial.print("\"temperatureT2\": ");
  Serial.print(emontx.TemperatureT2);
  Serial.print(", ");

  Serial.print("\"temperatureDiff\": ");
  Serial.print(emontx.TemperatureDiff);
  Serial.print(", ");

  Serial.print("\"flow\": ");
  Serial.print(emontx.Flow);
  Serial.print(", ");

  Serial.print("\"volumen1\": ");
  Serial.print(emontx.Volumen1);
  Serial.println("}");

  delay(POLLINTERVAL);

}

//********************************************Kamstrup Stuff Start********************************************

#define KAM_BUFFER_SIZE 100
// kamReadReg - read a Kamstrup register
float kamReadReg(unsigned short kreg) {

  byte recvmsg[KAM_BUFFER_SIZE];                                                                                                            // buffer of bytes to hold the received data
  float rval;                                                                                                                  // this will hold the final value

  // prepare message to send and send it
  byte sendmsg[] = {
    0x3f, 0x10, 0x01, (kregnums[kreg] >> 8), (kregnums[kreg] & 0xff)
  };
  kamSend(sendmsg, 5);

  // listen if we get an answer
  unsigned short rxnum = kamReceive(recvmsg);

  // check if number of received bytes > 0
  if (rxnum != 0) {


    // decode the received message
    rval = kamDecode(kreg, recvmsg);

    switch (kreg) {                                                                                                                //This section provided by Robert Wall on http://openenergymonitor.org/emon/node/5718
      case 0 :
        emontx.Energy = rval;
        break;
      case 1 :
        emontx.CurrentPower = rval;
        break;
      case 2 :
        emontx.TemperatureT1 = rval;
        break;
      case 3 :
        emontx.TemperatureT2 = rval;
        break;
      case 4 :
        emontx.TemperatureDiff = rval;
        break;
      case 5 :
        emontx.Flow = rval;
        break;
      case 6 :
        emontx.Volumen1 = rval;
        break;

    }


    return rval;
  }

}

// kamSend - send data to Kamstrup meter
void kamSend(byte const *msg, int msgsize) {

  // append checksum bytes to message
  byte newmsg[msgsize + 2];
  for (int i = 0; i < msgsize; i++) {
    newmsg[i] = msg[i];
  }
  newmsg[msgsize++] = 0x00;
  newmsg[msgsize++] = 0x00;
  int c = crc_1021(newmsg, msgsize);
  newmsg[msgsize - 2] = (c >> 8);
  newmsg[msgsize - 1] = c & 0xff;

  // build final transmit message - escape various bytes
  byte txmsg[20] = {
    0x80
  };                                                                                                  // prefix
  int txsize = 1;
  for (int i = 0; i < msgsize; i++) {
    if (newmsg[i] == 0x06 or newmsg[i] == 0x0d or newmsg[i] == 0x1b or newmsg[i] == 0x40 or newmsg[i] == 0x80) {
      txmsg[txsize++] = 0x1b;
      txmsg[txsize++] = newmsg[i] ^ 0xff;
    }
    else {
      txmsg[txsize++] = newmsg[i];
    }
  }
  txmsg[txsize++] = 0x0d;                                                                                                     // EOF

  // send to serial interface
  for (int x = 0; x < txsize; x++) {
    kamSer.write(txmsg[x]);
  }

}

// kamReceive - receive bytes from Kamstrup meter
unsigned short kamReceive(byte recvmsg[]) {

  byte rxdata[50];                                                                                                            // buffer to hold received data
  unsigned long rxindex = 0;
  unsigned long starttime = millis();

  kamSer.flush();                                                                                                             // flush serial buffer - might contain noise

  byte r;

  // loop until EOL received or timeout
  while (r != 0x0d) {

    // handle rx timeout
    if (millis() - starttime > KAMTIMEOUT) {
      Serial.println("Timed out listening for data");
      return 0;
    }

    // handle incoming data
    if (kamSer.available()) {

      // receive byte
      r = kamSer.read();
      if (r != 0x40) {                                                                                                        // don't append if we see the start marker
        // append data
        rxdata[rxindex] = r;
        rxindex++;
      }

    }
  }

  // remove escape markers from received data
  unsigned short j = 0;
  for (unsigned short i = 0; i < rxindex - 1; i++) {
    if (rxdata[i] == 0x1b) {
      byte v = rxdata[i + 1] ^ 0xff;
      if (v != 0x06 and v != 0x0d and v != 0x1b and v != 0x40 and v != 0x80) {
        Serial.print("Missing escape ");
        Serial.println(v, HEX);
      }
      if(j<KAM_BUFFER_SIZE) recvmsg[j] = v;
      i++;                                                                                                                   // skip
    }
    else {
      if(j<KAM_BUFFER_SIZE) recvmsg[j] = rxdata[i];
    }
    j++;
  }

  // check CRC
  if (crc_1021(recvmsg, j)) {
    Serial.println("CRC error: ");
    return 0;
  }

  return j;

}

// kamDecode - decodes received data
float kamDecode(unsigned short const kreg, byte const *msg) {

  // skip if message is not valid
  if (msg[0] != 0x3f or msg[1] != 0x10) {
    return false;
  }
  if (msg[2] != (kregnums[kreg] >> 8) or msg[3] != (kregnums[kreg] & 0xff)) {
    return false;
  }

  // decode the mantissa
  long x = 0;
  for (int i = 0; i < msg[5]; i++) {
    x <<= 8;
    x |= msg[i + 7];
  }

  // decode the exponent
  int i = msg[6] & 0x3f;
  if (msg[6] & 0x40) {
    i = -i;
  };
  float ifl = pow(10, i);
  if (msg[6] & 0x80) {
    ifl = -ifl;
  }

  // return final value
  return (float )(x * ifl);

}

// crc_1021 - calculate crc16
long crc_1021(byte const *inmsg, unsigned int len) {
  long creg = 0x0000;
  for (unsigned int i = 0; i < len; i++) {
    int mask = 0x80;
    while (mask > 0) {
      creg <<= 1;
      if (inmsg[i] & mask) {
        creg |= 1;
      }
      mask >>= 1;
      if (creg & 0x10000) {
        creg &= 0xffff;
        creg ^= 0x1021;
      }
    }
  }
  return creg;
}

//********************************************Kamstrup Stuff End********************************************


