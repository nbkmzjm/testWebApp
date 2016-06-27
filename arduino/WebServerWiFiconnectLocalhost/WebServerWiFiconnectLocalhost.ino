


#include <ArduinoJson.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <DHT.h>

char ssid[] = "ThienIphone";      //  your network SSID (name)
char pass[] = "aivynguyen";   // your network password
int keyIndex = 0;                 // your network key Index number (needed only for WEP)
const int acPin = 4;
#define DHTPin 5
#define HEATPin 13
#define ACPin 15
#define DHTTYPE DHT22

DHT dht(DHTPin, DHTTYPE);
float hum;
float temp;
float sTemp = 78;
String ACmode = "OFF";
String ACstatus = "OFF";
String json;
int i = 1;
int status = WL_IDLE_STATUS;

char host[] = "tstat.herokuapp.com"; 
WiFiClient client;

long lastConTime = 0;
const long delayInterval= 1000L;

void setup() {
  Serial.begin(115200);      // initialize serial communication
  dht.begin();
  pinMode(ACPin, OUTPUT);      // set the LED pin mode
  pinMode(HEATPin, OUTPUT);      // set the LED pin mode
 
  
  // attempt to connect to Wifi network:
  while (status != WL_CONNECTED) {
    Serial.print("Attempting to connect to Network named: ");
    Serial.println(ssid);                   // print the network name (SSID);

    // Connect to WPA/WPA2 network. Change this line if using open or WEP network:
    status = WiFi.begin(ssid, pass);
    // wait 10 seconds for connection:
    delay(5000);
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
    url += 1;
    url += "&humid=";
    url += 1;
    url += "&ACmode=";
    url += ACmode;
    url += "&ACstatus=";
    url += ACstatus;
    url += "&sTemp=";
    url += sTemp;

    Serial.println(url);
    client.print(String("GET ") + url + " HTTP/1.1\r\n" +
                 "Host: " + host + "\r\n" + 
                 "Connection: close\r\n\r\n");
                   
    digitalWrite(ACPin, LOW);
    digitalWrite(HEATPin, LOW);
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
      
      Serial.print("result x: ");
      Serial.print(ACmode);
      Serial.println();
      Serial.print("result y: ");
      Serial.print(sTemp);
      Serial.println();



      if(ACmode=="HEAT"){
        digitalWrite(HEATPin, HIGH);
        ACstatus = "HEAT ON";
        
      }else if(ACmode=="COOL"){
        digitalWrite(ACPin, HIGH);
        ACstatus = "COOL ON";
      }else{
        digitalWrite(ACPin, LOW);
        digitalWrite(HEATPin, LOW);
        ACstatus = "OFF";
      }


//      client.connect(host, 80);
      String url = "/tstatMoni";
      url += "?temp=";
      url += temp;
      url += "&humid=";
      url += hum;
      url += "&ACmode=";
      url += ACmode;
      url += "&ACstatus=";
      url += ACstatus;
      url += "&sTemp=";
      url += sTemp;

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
