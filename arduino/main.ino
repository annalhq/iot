#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

const char *ssid = "wifi";
const char *password = "pswd";

const char *nextjsHost = "IP_ADDRESS"; 
const int nextjsPort = 3000;

const int digitalPin = 4;
const int analogPin = A0;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000;

void connectWiFi()
{
     Serial.print("\nConnecting to: ");
     Serial.println(ssid);

     WiFi.mode(WIFI_STA);
     WiFi.begin(ssid, password);

     int tries = 0;
     while (WiFi.status() != WL_CONNECTED)
     {
          delay(500);
          Serial.print(".");
          if (++tries > 40)
          {
               Serial.println("\n[WiFi] FAILED");
               return;
          }
     }

     Serial.println("\n[WiFi] Connected!");
     Serial.println(WiFi.localIP());
}

void sendTelemetry(int level, String levelStr)
{
     if (WiFi.status() != WL_CONNECTED)
     {
          connectWiFi();
          return;
     }

     // http client
     WiFiClient client;
     client.setTimeout(10000);

     HTTPClient http;

     String url = "http://" + String(nextjsHost) + ":" + String(nextjsPort) + "/api/telemetry";

     Serial.println("\n[HTTP] POST → " + url);

     if (!http.begin(client, url))
     {
          Serial.println("[HTTP] begin failed");
          return;
     }

     http.addHeader("Content-Type", "application/json");

     String payload = "{\"analogLevel\":";
     payload += String(level);
     payload += ",\"noiseLevel\":\"";
     payload += levelStr;
     payload += "\"}";

     Serial.println("[HTTP] Payload: " + payload);

     int code = http.POST(payload);

     if (code == 200)
          Serial.println("[HTTP] OK");
     else if (code == -1)
          Serial.println("[HTTP] FAILED (server unreachable)");
     else
          Serial.println("[HTTP] Code: " + String(code));

     if (code > 0)
     {
          String body = http.getString();
          Serial.println("[HTTP] Body: " + body);
     }

     http.end();
}

void setup()
{
     Serial.begin(115200);
     delay(500);

     pinMode(digitalPin, INPUT);
     connectWiFi();
}

void loop()
{
     unsigned long startMs = millis();
     unsigned int sigMax = 0, sigMin = 1024;

     // Sample for 50ms (captures waveform envelope)
     while (millis() - startMs < 50)
     {
          unsigned int s = analogRead(analogPin);
          if (s < 1024)
          {
               if (s > sigMax)
                    sigMax = s;
               if (s < sigMin)
                    sigMin = s;
          }
     }

     // Peak-to-peak amplitude
     int analogValue = sigMax - sigMin;

     // Convert ADC to voltage
     float voltage = analogValue * (1.0 / 1024.0);

     // prevent log(0)
     if (voltage < 0.001)
          voltage = 0.001;

     // dB calculation (tunable reference)
     float dB = 20 * log10(voltage / 0.006);

     // classification
     String noiseLevel;
     if (dB < 30)
          noiseLevel = "Quiet";
     else if (dB < 50)
          noiseLevel = "Moderate";
     else if (dB < 70)
          noiseLevel = "Loud";
     else if (dB < 85)
          noiseLevel = "Very Loud";
     else
          noiseLevel = "Hazardous";

     Serial.print("[Sensor] ");
     Serial.print(analogValue);
     Serial.print(" ");
     Serial.println(noiseLevel);

     if (millis() - lastSendTime >= sendInterval)
     {
          sendTelemetry((int)dB, noiseLevel);
          lastSendTime = millis();
     }
}