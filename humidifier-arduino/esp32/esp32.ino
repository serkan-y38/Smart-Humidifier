#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"
#include "secrets.h"

#define DHT_VCC_PIN 19
#define DHTPIN      18
#define DHTTYPE     DHT11
#define RELAY_PIN   23
#define LED_PIN     13

const unsigned long CYCLE_MS = 5000;
const unsigned long BLINK_MS = 1000;
const unsigned long WIFI_TIMEOUT_MS = 15000;
const unsigned long HTTP_TIMEOUT_MS = 4000;

DHT dht(DHTPIN, DHTTYPE);

String mode = "auto";
float threshold = 80.0;
bool relayOn = false;

unsigned long lastCycle = 0;
unsigned long lastBlink = 0;
bool ledState = false;

void setRelay(bool on) {
  relayOn = on;
  digitalWrite(RELAY_PIN, on ? HIGH : LOW);
  if (!on) {
    ledState = false;
    digitalWrite(LED_PIN, LOW);
  }
}

void applyControl(float humidity) {
  if (mode == "on") {
    setRelay(true);
  } else if (mode == "off") {
    setRelay(false);
  } else {
    setRelay(humidity < threshold);
  }
}

void updateLed(unsigned long now) {
  if (!relayOn) return;
  if (now - lastBlink >= BLINK_MS) {
    lastBlink = now;
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
  }
}

bool connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_TIMEOUT_MS) {
    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(" connected, IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println(" failed");
  return false;
}

void sendReading(float humidity, float temperature) {
  if (!connectWifi()) return;

  JsonDocument body;
  body["humidity"] = humidity;
  body["temperature"] = temperature;
  body["relay"] = relayOn;

  String payload;
  serializeJson(body, payload);

  HTTPClient http;
  http.begin(SERVER_URL);
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);

  int code = http.POST(payload);

  if (code == 200) {
    JsonDocument response;
    DeserializationError err = deserializeJson(response, http.getString());
    if (!err) {
      const char* newMode = response["mode"];
      if (newMode != nullptr) {
        String m = String(newMode);
        if (m == "auto" || m == "on" || m == "off") mode = m;
      }
      threshold = response["threshold"] | threshold;
    } else {
      Serial.print("JSON error: ");
      Serial.println(err.c_str());
    }
  } else {
    Serial.print("POST failed: ");
    Serial.println(code);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  setRelay(false);

  pinMode(DHT_VCC_PIN, OUTPUT);
  digitalWrite(DHT_VCC_PIN, HIGH);
  delay(1500);
  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  connectWifi();

  lastCycle = millis() - CYCLE_MS;
  Serial.println("Started");
}

void loop() {
  unsigned long now = millis();
  updateLed(now);

  if (now - lastCycle < CYCLE_MS) return;
  lastCycle = now;

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Read error, relay state unchanged");
    return;
  }

  applyControl(humidity);
  sendReading(humidity, temperature);
  applyControl(humidity);

  Serial.print("Humidity: %");
  Serial.print(humidity);
  Serial.print("  Temperature: ");
  Serial.print(temperature);
  Serial.print(" C  Mode: ");
  Serial.print(mode);
  Serial.print("  Threshold: ");
  Serial.print(threshold);
  Serial.print("  Relay: ");
  Serial.println(relayOn ? "ON" : "OFF");
}