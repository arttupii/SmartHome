class BitStream {
  public:
    BitStream(int size);
    ~BitStream();
    void clear();
    void set(BitStream &s);
    void addBit(char v);
    void print();
    int count();
    int ready();
    const unsigned char byte(int i);
    const unsigned char *p() {
	return bytes;
    }
  protected:
    int c;
    int c1;
    int isReady;
    int size;
    unsigned char *bytes;
};

