#include <node.h>
#include <v8.h>
#include "NexaCtrl.h"

using namespace v8;

NexaCtrl *nexaCtrl=NULL;
 
void Method(const v8::FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	args.GetReturnValue().Set(String::NewFromUtf8(isolate, "worlde"));
}

void NexaOn(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 2) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}
		
	unsigned int controller_id = (int)args[0]->NumberValue();
	unsigned int device_id = (int)args[1]->NumberValue();
	
	if(nexaCtrl==NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is not initialized")));
		return;
	}
	
	printf("NexaOn: controller_id=%d, device_id=%d\n", controller_id, device_id);
	nexaCtrl->DeviceOn(controller_id, device_id);
	args.GetReturnValue().Set(0);
}

void NexaOff(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 2) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}

	if(nexaCtrl==NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is not initialized")));
		return;
	}
	
	unsigned int controller_id = (int)args[0]->NumberValue();
	unsigned int device_id = (int)args[1]->NumberValue();
	
	printf("NexaOff: controller_id=%d, device_id=%d\n", controller_id, device_id);
	nexaCtrl->DeviceOff(controller_id, device_id);
	args.GetReturnValue().Set(0);
}

void NexaPairing(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 2) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}

	if(nexaCtrl==NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is not initialized")));
		return;
	}
	
	unsigned int controller_id = (int)args[0]->NumberValue();
	unsigned int device_id = (int)args[1]->NumberValue();
	
	printf("NexaPairing: controller_id=%d, device_id=%d\n", controller_id, device_id);
	
	for(int i=0;i<10;i++) {
	  nexaCtrl->DeviceOn(controller_id, device_id);
	}
	
	args.GetReturnValue().Set(0);
}

void NexaUnpairing(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 2) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}

	if(nexaCtrl==NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is not initialized")));
		return;
	}
	
	unsigned int controller_id = (int)args[0]->NumberValue();
	unsigned int device_id = (int)args[1]->NumberValue();
	
	printf("NexaUnpairing: controller_id=%d, device_id=%d\n", controller_id, device_id);
	
	for(int i=0;i<10;i++) {
	  nexaCtrl->DeviceOff(controller_id, device_id);
	}
	
	args.GetReturnValue().Set(0);
}


void NexaDim(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 3) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber() || !args[1]->IsNumber() || !args[2]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}
	
	if(nexaCtrl==NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is not initialized")));
		return;
	}
	unsigned int controller_id = (int)args[0]->NumberValue();
	unsigned int device_id = (int)args[1]->NumberValue();
	unsigned int dim = (int)args[2]->NumberValue();
	
	printf("NexaDim: controller_id=%d, device_id=%d, dim=%d\n", controller_id, device_id, dim);
	nexaCtrl->DeviceDim(controller_id, device_id, dim);
	args.GetReturnValue().Set(0);
}

void NexaInit(const FunctionCallbackInfo<Value>& args) {
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.Length() < 1) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong number of arguments")));
		return;
	}
	
	if (!args[0]->IsNumber()) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}
	
	unsigned int raspberryIoPin = (int)args[0]->NumberValue();
	
	if(nexaCtrl!=NULL) {
		isolate->ThrowException(Exception::TypeError(
				String::NewFromUtf8(isolate, "Nexa is already initialized")));
		return;
	}
	printf("NexaInit: raspberryIoPin=%d\n", raspberryIoPin);
	nexaCtrl = new NexaCtrl(raspberryIoPin);	
	
	args.GetReturnValue().Set(0);
}

void Init(Handle<Object> exports) {
	Isolate* isolate = Isolate::GetCurrent();
	exports->Set(String::NewFromUtf8(isolate, "nexaOn"),
			FunctionTemplate::New(isolate, NexaOn)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "nexaOff"),
			FunctionTemplate::New(isolate, NexaOff)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "nexaDim"),
			FunctionTemplate::New(isolate, Method)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "nexaInit"),
			FunctionTemplate::New(isolate, NexaInit)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "nexaPairing"),
			FunctionTemplate::New(isolate, NexaPairing)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "nexaUnpairing"),
			FunctionTemplate::New(isolate, NexaUnpairing)->GetFunction());
}

NODE_MODULE(nexa, Init)
