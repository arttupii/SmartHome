#include"BitStream.h"
#include"Arduino.h"

    BitStream::BitStream(int size) {
      this->size = size;
      bytes = (unsigned char*)malloc(size);
      clear();
    }
    BitStream::~BitStream() {
      free(bytes);
    }
    void BitStream::clear() {
      memset(bytes, 0xff, size);
      c = 0;
      c1 = 0;
      isReady = 0;
    }
    void BitStream::set(BitStream &s) {
      isReady = 1;
      memcpy(bytes, s.bytes, size);
      c = s.c;
      c1 = s.c1;
    }
    void BitStream::addBit(char v) {
      if (v) {
        bytes[c] = (bytes[c] << 1) | 0x1;
      } else {
        bytes[c] = (bytes[c] << 1) & 0xfe;
      }
      c1++;
      if (c1 > 7) {
        c++;
        c1 = 0;
        if (c >= size) c = size;
      }
    }

    void BitStream::print() {
      Serial.print("\nHEX: ");
      for (int i = 0; i < size; i++) {
        unsigned int t = this->byte(i) & 0xff;
        Serial.print(t, HEX);
        Serial.print(" ");
      }
      Serial.print("\n");
    }

    int BitStream::count() {
      return c * 8 + c1;
    }

    int BitStream::ready() {
      return isReady;
    }

    const unsigned char BitStream::byte(int i) {
      return bytes[i];
    }


