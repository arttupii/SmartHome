#ifndef JSON
#define JSON

class Json{
	public:
		Json();
		~Json();
		void start();
		void end();
		void add(const char* name, double val, int precision=5);
		void add(const char* name, float val);
		void add(const char* name, int val);
		void add(const char* name, unsigned long long  val);
 		void add(const char* name, bool val);
 
	private:
		bool first;
		void addDefault(const char *name);
};

#endif
