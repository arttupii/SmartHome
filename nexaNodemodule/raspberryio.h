#ifndef RASPBERRYIO_H
#define RASPBERRYIO_H

#define OUTPUT 1
#define LOW 0
#define HIGH 1

void pinMode(int pin, int mode);
void digitalWrite(int pin, int state);
void delayMicroseconds(unsigned long ms);
void cli();
void sei();

#endif