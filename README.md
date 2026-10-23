# Smart Road Health Monitoring System

An IoT-enabled telemetry, pothole detection, and road health scoring software platform built for an engineering clinic project demonstration.

> **Current System Status:**  
> 🟡 **SIMULATION MODE**  
> 🔴 **Hardware: Not Connected**  
> *Sensor data is generated locally using physics-based stochastic algorithms. When physical hardware is connected, `SimulatedSensorService` can be hot-swapped for `Esp32SensorService` with zero changes to the UI or Detection Engine.*

---

## 🚀 Key Features

- **Rule-Based Sensor Fusion Engine**: Real-time correlation of ultrasonic distance anomalies (40%), vertical acceleration spikes (40%), and chassis vibration (20%) to compute a 0–100% confidence score.
- **Dynamic Road Condition Monitor**: Real-time classification into `NORMAL`, `WARNING`, and `CRITICAL` operational states.
- **Geospatial GIS Mapping (Leaflet + OpenStreetMap)**: Live vehicle tracking along realistic road waypoints, severity-colored pins (`HIGH` = Red, `MEDIUM` = Amber, `LOW` = Green), and rich telemetry inspection popups.
- **8-Phase Event Pipeline Visualizer**: Demonstrates the exact physical progression from cavity approach to ultrasonic drop, IMU jerk, piezoelectric saturation, geotagging, and cloud persistence.
- **Road Health Index (0–100)**: Sector-level road health scoring with severity penalties and repair restoration credits.
- **Detection History & Audit Trail**: Searchable, filterable log with lifecycle state updates (`NEW` ➔ `VERIFIED` ➔ `REPAIRED`), CSV report export, and LocalStorage persistence.
- **Automated Demo Mode**: One-click scripted demonstration cycling through smooth road, rough road, medium pothole, and severe impact conditions.
- **Simulated Hardware Buzzer**: Web Audio API synthesized piezo audio alert matching onboard ESP32 buzzer behavior.

---

## 🛠️ System Architecture

```
                                  +-----------------------------+
                                  |     ISensorService (API)    |
                                  +--------------+--------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
        +--------------v--------------+                     +--------------v--------------+
        |   SimulatedSensorService    |                     |     Esp32SensorService      |
        | (Realistic Stream 350-450ms)|                     |  (Future JSON WebSocket/API)|
        +--------------+--------------+                     +-----------------------------+
                       |
                       v
        +-----------------------------+
        |   PotholeDetectionEngine    |  <-- Configurable Thresholds & Weights
        | (Distance/Accel/Vibration)  |      (40% Dist, 40% Accel, 20% Vib)
        +--------------+--------------+
                       |
        +--------------v--------------+
        | SeverityClassifier & Health |  <-- Severity: LOW / MEDIUM / HIGH
        | Scoring (0-100 Road Index)  |      Road Health: GOOD / MODERATE / POOR
        +--------------+--------------+
                       |
        +--------------v--------------+
        |   LocalStorage Persistence  |  <-- Pre-seeded with 9 realistic detections
        +--------------+--------------+      Persists NEW / VERIFIED / REPAIRED
                       |
        +--------------v--------------+
        |     React Context / UI      |
        +--------------+--------------+
```

---

## 🧠 Pothole Detection & Sensor Fusion Algorithm

The system avoids naive single-sensor false alarms by implementing a weighted multi-condition matrix:

$$\text{Confidence} = W_{\text{dist}} \cdot C_{\text{dist}} + W_{\text{accel}} \cdot C_{\text{accel}} + W_{\text{vib}} \cdot C_{\text{vib}}$$

Where:
- $W_{\text{dist}} = 0.40$ (Ultrasonic depth delta against rolling baseline)
- $W_{\text{accel}} = 0.40$ (Vertical $Z$-axis acceleration delta $|\Delta a_z|$)
- $W_{\text{vib}} = 0.20$ (Piezoelectric vibration level)

### Thresholds:
| Telemetry Parameter | Baseline (Normal) | Minor Irregularity | Medium Pothole | Severe Pothole |
| :--- | :--- | :--- | :--- | :--- |
| **HC-SR04 Distance** | 18 – 25 cm | 25 – 30 cm | 30 – 40 cm | 40 – 55 cm |
| **MPU9250 Accel-Z** | $\approx 9.81\text{ m/s}^2$ | $\Delta \ge 4.0\text{ m/s}^2$ | $\Delta \ge 7.0\text{ m/s}^2$ | $\Delta \ge 10.0\text{ m/s}^2$ |
| **SW-420 Vibration** | 5 – 20 | 25 – 55 | 60 – 79 | 80 – 100 |

- **Confidence $< 45\%$**: `NORMAL`
- **Confidence $45\% - 69\%$**: `POSSIBLE IRREGULARITY`
- **Confidence $\ge 70\%$**: `POTHOLE DETECTED` (Triggers GPS geotagging & database persistence)

---

## 🔌 Future ESP32 Hardware Integration Guide

### 1. Expected ESP32 Ingestion JSON Protocol
The physical ESP32 MCU will transmit telemetry packets over WebSocket, Serial UART, or HTTP POST matching this schema:

```json
{
  "timestamp": "2026-09-18T17:30:00.000Z",
  "ultrasonicDistance": 21.4,
  "acceleration": {
    "x": 0.20,
    "y": 0.10,
    "z": 9.78
  },
  "gyroscope": {
    "x": 0.12,
    "y": 0.30,
    "z": 0.05
  },
  "vibration": 12,
  "gps": {
    "latitude": 16.506200,
    "longitude": 80.648000,
    "speed": 34.2,
    "heading": 45.0,
    "isLocked": true
  }
}
```

### 2. How to Hot-Swap to Hardware
In [`src/context/SystemContext.tsx`](file:///c:/Users/sarthak/pothole%20detection/src/context/SystemContext.tsx):
```typescript
// Replace this line:
const sensorServiceRef = useRef<ISensorService>(new SimulatedSensorService());

// With this line:
const sensorServiceRef = useRef<ISensorService>(new Esp32SensorService('ws://192.168.4.1:81'));
```
Zero modifications to the UI, charts, or maps are required!

---

## 💻 How to Run the Project Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm or yarn

### Installation & Launch
```bash
# 1. Clone or navigate to the project directory
cd "pothole detection"

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at `http://localhost:3000/`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
pothole detection/
├── src/
│   ├── config/
│   │   └── detectionConfig.ts      # Central thresholds, weights & route coordinates
│   ├── context/
│   │   └── SystemContext.tsx       # Central state management & Web Audio buzzer
│   ├── services/
│   │   ├── SensorService.ts        # Pluggable ISensorService interface
│   │   ├── SimulatedSensorService.ts # Physics-based sensor generator & scenarios
│   │   ├── Esp32SensorService.ts   # Hardware WebSocket bridge adapter
│   │   ├── DetectionEngine.ts      # Rule-based sensor fusion algorithm
│   │   ├── RoadHealthEngine.ts     # 0-100 road health index calculator
│   │   └── StorageService.ts       # LocalStorage persistence & seed data
│   ├── types/
│   │   └── index.ts                # TypeScript data contracts & interfaces
│   ├── views/
│   │   ├── DashboardView.tsx       # Executive overview & dynamic condition
│   │   ├── LiveMonitoringView.tsx  # Telemetry dials & streaming charts
│   │   ├── SimulationControlView.tsx # Scenario triggers & 8-phase visualizer
│   │   ├── PotholeMapView.tsx      # Leaflet + OpenStreetMap GIS map
│   │   ├── DetectionHistoryView.tsx# Filterable table, CSV export, lifecycle
│   │   ├── AnalyticsView.tsx       # Recharts severity & degradation trends
│   │   └── SystemStatusView.tsx    # Subsystems & ESP32 JSON specifications
│   ├── components/
│   │   ├── Header.tsx              # Top bar, simulation indicators, demo button
│   │   ├── TabNavigation.tsx       # Navigation tabs router
│   │   ├── ToastContainer.tsx      # Animated notification toasts
│   │   └── PotholeDetailModal.tsx  # Telemetry snapshot & status manager
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```
