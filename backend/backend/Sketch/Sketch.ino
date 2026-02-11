#include <WiFi.h>
#include <ArduinoOTA.h>

const char* ssid = "OC LA NET KEKUTHA?";
const char* password = "11111111";

const int red1 = 2;
const int green1 = 4;
const int blue1 = 5;
const int red2 = 12;
const int green2 = 13;
const int blue2 = 14;
const int red3 = 25;
const int green3 = 26;
const int blue3 = 27;

void setup() {
  Serial.begin(115200);
  pinMode(red1, OUTPUT);
  pinMode(green1, OUTPUT);
  pinMode(blue1, OUTPUT);
  pinMode(red2, OUTPUT);
  pinMode(green2, OUTPUT);
  pinMode(blue2, OUTPUT);
  pinMode(red3, OUTPUT);
  pinMode(green3, OUTPUT);
  pinMode(blue3, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  ArduinoOTA.begin();
}

void loop() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(red1, HIGH);
    digitalWrite(green1, HIGH);
    digitalWrite(blue1, HIGH);
    digitalWrite(red2, HIGH);
    digitalWrite(green2, HIGH);
    digitalWrite(blue2, HIGH);
    digitalWrite(red3, HIGH);
    digitalWrite(green3, HIGH);
    digitalWrite(blue3, HIGH);
    delay(1000);
    
    digitalWrite(red1, LOW);
    digitalWrite(green1, LOW);
    digitalWrite(blue1, LOW);
    digitalWrite(red2, LOW);
    digitalWrite(green2, LOW);
    digitalWrite(blue2, LOW);
    digitalWrite(red3, LOW);
    digitalWrite(green3, LOW);
    digitalWrite(blue3, LOW);
    delay(1000);
  }
}