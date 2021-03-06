#include <ArduinoJson.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <DHT.h>

char ssid[] = "FireBall";      //  your network SSID (name)
char pass[] = "fish1ing";   // your network password
int keyIndex = 0;                 // your network key Index number (needed only for WEP)
const int acPin = 4;
#define DHTPin 5
#define HEATPin 4
#define ACPin 14
#define FANPin 12
#define DHTTYPE DHT22

DHT dht(DHTPin, DHTTYPE);
float hum;
float temp;
float sTemp = 130;
String ACmode = "OFF";
String ACstatus = "OFF";
String FanStatus = "AUTO";
String FanMode = "AUTO";
String json;
int i = 1;
int status = WL_IDLE_STATUS;

char host[] = "tstat.herokuapp.com"; 
WiFiClient client;

long lastConTime = 0;
const long delayInterval= 1000L;

long lastOnTime = 0;
const long delayOnInt = 210000;


void setup() {
  Serial.begin(115200);      // initialize serial communication
  dht.begin();
  pinMode(ACPin, OUTPUT);      // set the LED pin mode
  pinMode(HEATPin, OUTPUT);      // set the LED pin mode
  pinMode(FANPin, OUTPUT);
  hum = dht.readHumidity();
  temp = dht.readTemperature();
  
  // attempt to connect to Wifi network:
  while (status != WL_CONNECTED) {
    
    Serial.print("Attempting to connect to Network named: ");
    Serial.println(ssid);                   // print the network name (SSID);

    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);
    // wait 10 seconds for connection:
    digitalWrite(HEATPin, HIGH);
    delay(1000);
    digitalWrite(HEATPin, LOW);
     delay(1000);
    digitalWrite(HEATPin, HIGH);
    delay(1000);
    digitalWrite(HEATPin, LOW);
    delay(10000);
  }

  Serial.println("Connected to wifi");
  printWifiStatus();                        // you're connected now, so print out the status

  Serial.println("\nStarting connection to server...");
  // if you get a connection, report back via serial:
  if (client.connect(host, 80)) {
    Serial.println("connected to server");
    // Make a HTTP request:
  
    client.connect(host, 80);
    String url = "/tstatMoni";
    url += "?temp=";
    url += temp;
    url += "&humid=";
    url += hum;
    url += "&ACmode=";
    url += ACmode;
    url += "&FanMode=";
    url += FanMode;
    url += "&FanStatus=";
    url += FanStatus;
    url += "&ACstatus=";
    url += ACstatus;
    url += "&sTemp=";
    url += sTemp;

    Serial.println(url);
    client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                 "Host: " + host + "\r\n" + 
                 "Connection: close\r\n\r\n");
                   
    digitalWrite(ACPin, LOW);
    digitalWrite(HEATPin, HIGH);
    digitalWrite(FANPin, LOW);
  } 
}

void loop() {

  hum = dht.readHumidity();
  temp = dht.readTemperature();
  
  
  if (millis()- lastConTime > delayInterval){
//    client.stop();
    if(client.connect(host, 80)){
//      client.connect(host, 80);
      
      String urlWebSet = "/tstatWebSet";
      
      
      client.print(String("GET ") + urlWebSet + " HTTP/1.1\r\n" +
                   "Host: " + host + "\r\n\r\n"); 
//                   "Connection: close\r\n\r\n");
        Serial.println("client connected..");


//      client.connect(host, 80);
//      String urlparam = "";
//      urlparam += "mode=";
//      urlparam += temp;
//      urlparam += "&sTemp=";
//      urlparam += hum;
//
//      client.print(String("POST /tstatMode") + " HTTP/1.1\r\n" +
//                   "Host: " + host + "\r\n" + 
//                   "Connection: close\r\n" +
//                   "Content-Type: application/x-www-form-urlencoded\r\n" + 
//                   "Content-Length: " + urlparam.length()+ "\r\n\r\n"+
//                   urlparam+ "\r\n");
                   
      lastConTime = millis();
    }else{
      Serial.println("connection failed");
    }
  }


  while (client.available()) {
        
    json = client.readStringUntil('\r');
    if(i==11){
      Serial.println("json is:" + json);
      if(json.indexOf("xx")==-1){
      char jsonArr[json.length()+1];
      json.toCharArray(jsonArr,json.length()+1);


      StaticJsonBuffer<200> jsonBuffer;
      JsonObject& root = jsonBuffer.parseObject(jsonArr);
      ACmode = root["ACmode"].asString();
      sTemp = root["sTemp"];
      FanMode = root["FanMode"].asString();
      
      Serial.print("result AC mode: ");
      Serial.print(ACmode);
      Serial.println();
      Serial.print("result Set Temp: ");
      Serial.print(sTemp);
      Serial.println();
      Serial.print("result Fan Mode: ");
      Serial.print(FanMode);
      Serial.println();
     

      if(ACmode.indexOf("HEAT")!=-1 ){
         
     
        if(sTemp-temp>0){
           if( millis()-lastOnTime>delayOnInt){
              digitalWrite(HEATPin, LOW);
              digitalWrite(ACPin, HIGH);
              digitalWrite(FANPin, HIGH);
              ACstatus = "HEATOn";
              FanStatus = "ON";
              lastOnTime = millis();
             }else if(ACstatus != "HEATOn"){
            
              String waitSec = String((delayOnInt/1000)-((millis()-lastOnTime)/1000));
              ACstatus = String("Waiting:_"+ waitSec);
            }
        
        }else if(sTemp-temp<0){
          digitalWrite(HEATPin, HIGH);
          digitalWrite(ACPin, LOW);
          ACstatus = "HEATOff";
          lastOnTime = millis();
          if(FanMode.indexOf("AUTO")!=-1){
            digitalWrite(FANPin, LOW);
            FanStatus = "OFF";
          }
        }
          
          
       
        
      }else if(ACmode.indexOf("COOL")!=-1){
        
      
        if(sTemp - temp< - 0.5 ){
          if( millis()-lastOnTime>delayOnInt){
            digitalWrite(ACPin, HIGH);
            digitalWrite(HEATPin, HIGH);
            digitalWrite(FANPin, HIGH);
            ACstatus = "COOLOn";
            FanStatus = "ON";
            lastOnTime = millis();
          }else if(ACstatus != "COOLOn"){
            
            String waitSec = String((delayOnInt/1000)-((millis()-lastOnTime)/1000));
            ACstatus = String("Waiting:_"+ waitSec);
          }
        
        }else if(sTemp - temp>0){
          digitalWrite(ACPin, LOW);
          digitalWrite(HEATPin, HIGH);
          ACstatus = "COOLOff"; 
          lastOnTime = millis();
          if(FanMode.indexOf("AUTO")!=-1){
            digitalWrite(FANPin, LOW);
            FanStatus = "OFF";
          }

        }
      }else if(ACmode.indexOf("OFF")!=-1){
        digitalWrite(ACPin, LOW);
        digitalWrite(HEATPin, HIGH);
        ACstatus = "OFF";
        lastOnTime = millis();
        if(FanMode.indexOf("AUTO")!=-1){
          digitalWrite(FANPin, LOW);
          FanStatus = "OFF";
        }else{
          
          digitalWrite(FANPin, HIGH);
          FanStatus = "ON";
          
        }
        
      }

      
      


//      client.connect(host, 80);
      String url = "/tstatMoni";
      url += "?temp=";
      url += temp;
      url += "&humid=";
      url += hum;
      url += "&ACmode=";
      url += ACmode;
      url += "&FanStatus=";
      url += FanStatus;
      url += "&ACstatus=";
      url += ACstatus;
      url += "&sTemp=";
      url += sTemp;
//      url += "&waiting=";
//      url += 10-((millis()-lastOnTime)/1000);
//      Serial.println("Waiting: ");
//      Serial.println((millis()-lastOnTime)/1000);
      
      Serial.println("url is:");
      Serial.println(url);
      client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                   "Host: " + host + "\r\n\r\n"); 
//                   "Connection: close\r\n\r\n");
        
      }
      i = 0; 
    }  
    i++;
     
  }



  
}


void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
  // print where to go in a browser:
  Serial.print("To see this page in action, open a browser to http://");
  Serial.println(ip);
}
