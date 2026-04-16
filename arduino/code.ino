#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
// WiFiClient is included with ESP8266WiFi

const char* ssid     = "erlich";
const char* password = "calabiyau";

// ============================================================
// CHANGE THIS TO YOUR COMPUTER'S LOCAL IP ADDRESS (IPv4)
// e.g. "192.168.1.15" (Check via `ipconfig` on Windows)
const char* nextjsHost = "10.75.106.75"; 
const int   nextjsPort = 3000;                     
// ============================================================

const int digitalPin = 4;
const int analogPin  = A0;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 1000;        // 1000 milliseconds = 1 second

void connectWiFi() {
  Serial.print("\nConnecting to: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++tries > 40) {
      Serial.println("\n[WiFi] FAILED — check SSID and password.");
      return;
    }
  }
  Serial.println("\n[WiFi] Connected!");
  Serial.print("[WiFi] IP: ");      Serial.println(WiFi.localIP());
  Serial.print("[WiFi] RSSI: ");    Serial.print(WiFi.RSSI()); Serial.println(" dBm");
}

void sendTelemetry(int level, String levelStr) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected — reconnecting...");
    connectWiFi();
    return;
  }

  WiFiClient client; // Standard HTTP for local Next.js server
  client.setTimeout(10000); 

  HTTPClient http;
  
  // Endpoint running on Next.js
  String url = "http://" + String(nextjsHost) + ":" + String(nextjsPort) + "/api/telemetry";

  Serial.println("\n[HTTP] POST → " + url);

  if (!http.begin(client, url)) {
    Serial.println("[HTTP] http.begin() failed — check host string.");
    return;
  }

  http.addHeader("Content-Type", "application/json");

  String payload = "{\"analogLevel\":" + String(level)
                 + ",\"noiseLevel\":\"" + levelStr + "\"}";
  Serial.println("[HTTP] Payload: " + payload);

  int code = http.POST(payload);

  // ---- Interpret response ----
  if      (code == 200)  Serial.println("[HTTP] 200 OK — Next.js received data!");
  else if (code == 404)  Serial.println("[HTTP] 404 NOT FOUND — URL path wrong.");
  else if (code == -1)   Serial.println("[HTTP] -1 FAILED — Is the Next.js server running and accessible?");
  else                   Serial.println("[HTTP] Code: " + String(code));

  if (code > 0) {
    String body = http.getString();
    if (body.length() > 0) Serial.println("[HTTP] Body: " + body);
  }

  // Extra debug if still -1
  if (code == -1) {
    Serial.println("[DEBUG] Heap free: " + String(ESP.getFreeHeap()) + " bytes");
    Serial.println("[DEBUG] WiFi status: " + String(WiFi.status()));
    IPAddress ip;
    bool resolved = WiFi.hostByName(nextjsHost, ip);
    Serial.print("[DEBUG] DNS resolved: ");
    Serial.println(resolved ? ip.toString() : "FAILED");
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=== Noise Sensor Starting ===");
  pinMode(digitalPin, INPUT);
  connectWiFi();
}

void loop() {
  // ---- 50ms peak-to-peak sampling ----
  unsigned long startMs = millis();
  unsigned int sigMax = 0, sigMin = 1024;
  while (millis() - startMs < 50) {
    unsigned int s = analogRead(analogPin);
    if (s < 1024) {
      if (s > sigMax) sigMax = s;
      if (s < sigMin) sigMin = s;
    }
  }
  int analogValue = sigMax - sigMin;
  int digitalValue = digitalRead(digitalPin);

  // ---- Classify ----
  String noiseLevel;
  if      (analogValue <= 2)  noiseLevel = "Quiet";
  else if (analogValue <= 5)  noiseLevel = "Moderate";
  else if (analogValue <= 10) noiseLevel = "Loud";
  else if (analogValue <= 12) noiseLevel = "Very Loud";
  else                         noiseLevel = "Hazardous";

  // ---- Serial output ----
  Serial.print("[Sensor] Level: "); Serial.print(analogValue);
  Serial.print("  ["); Serial.print(noiseLevel);
  Serial.print("]  Digital: ");
  Serial.println(digitalValue == LOW ? "DETECTED" : "Quiet");

  // ---- Send every 1s (1000ms) ----
  if (millis() - lastSendTime >= sendInterval) {
    sendTelemetry(analogValue, noiseLevel);
    lastSendTime = millis();
  }
}