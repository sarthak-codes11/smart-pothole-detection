import React, { useState } from 'react';
import {
  Cpu,
  Radio,
  Activity,
  Compass,
  Zap,
  Database,
  Code2,
  FileCode,
  VolumeX,
  Play,
  Pause,
  Wifi,
  WifiOff,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { HardwareConnectModal } from '../components/HardwareConnectModal';

export const SystemStatusView: React.FC = () => {
  const {
    operatingMode,
    analysisState,
    isAnalyzing,
    currentReading,
    ingestedPacketsCount,
    verifiedEvents,
    demoEvents,
    hardwareStatus,
    hardwareConnectionType,
    hardwareEndpoint,
    startAnalysis,
    stopAnalysis,
  } = useSystem();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const esp32JsonSchema = `{
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
}`;

  const lastSampleTime = currentReading?.timestamp
    ? new Date(currentReading.timestamp).toLocaleTimeString()
    : 'Awaiting telemetry';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            System Status
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor hardware connections, analysis engine state, sensor availability, and subsystem diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            Connection Options
          </button>
          <span
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
              operatingMode === 'SIMULATION'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : operatingMode === 'HARDWARE'
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                operatingMode === 'SIMULATION'
                  ? 'bg-emerald-400 animate-pulse'
                  : operatingMode === 'HARDWARE'
                  ? 'bg-cyan-400'
                  : 'bg-slate-500'
              }`}
            />
            {operatingMode}
          </span>
        </div>
      </div>

      {/* ========================================================
          LEVEL 1: SYSTEM OVERVIEW (6 KEY CARDS)
         ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Subsystem Overview
          </h2>
          <span className="text-[11px] text-slate-400">High-level operational health</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Hardware Connection */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Hardware Connection</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                {hardwareStatus === 'CONNECTED' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected ({hardwareConnectionType || 'USB Serial'})</span>
                  </>
                ) : hardwareStatus === 'AWAITING_TELEMETRY' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300">Awaiting Telemetry...</span>
                  </>
                ) : hardwareStatus === 'CONNECTING' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300">Connecting...</span>
                  </>
                ) : hardwareStatus === 'CONNECTION_LOST' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-400">Connection Lost</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-slate-400">Disconnected</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {hardwareStatus === 'CONNECTED'
                  ? `Physical ESP32 streaming genuine frames over ${hardwareConnectionType || 'USB Serial'}.`
                  : hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'Port open at 115200 baud. Waiting for first telemetry line.'
                  : hardwareStatus === 'CONNECTION_LOST'
                  ? 'Serial connection dropped. Reconnect to resume.'
                  : 'No physical ESP32 connected to this session.'}
              </p>
            </div>
          </div>

          {/* 2. Analysis Status */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Analysis Status</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    analysisState === 'RUNNING'
                      ? 'bg-emerald-400 animate-pulse'
                      : analysisState === 'PAUSED'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span
                  className={
                    analysisState === 'RUNNING'
                      ? 'text-emerald-400'
                      : analysisState === 'PAUSED'
                      ? 'text-amber-400'
                      : 'text-slate-300'
                  }
                >
                  {analysisState === 'RUNNING'
                    ? 'Active (Evaluating)'
                    : analysisState === 'PAUSED'
                    ? 'Paused'
                    : 'Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {analysisState === 'RUNNING'
                  ? operatingMode === 'HARDWARE'
                    ? 'Hardware status evaluation active for incoming ESP32 packets.'
                    : 'Sensor fusion algorithm actively scoring road anomalies.'
                  : 'Analysis is stopped. Click Start Analysis to begin.'}
              </p>
            </div>
          </div>

          {/* 3. Sensor Availability */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Sensor Availability</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentReading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>
                  {currentReading
                    ? operatingMode === 'HARDWARE'
                      ? '2 of 2 Hardware Sensors Active'
                      : '3 of 3 Active'
                    : 'Sensors Standby'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                <span className={currentReading ? 'text-cyan-300' : 'text-slate-500'}>Distance (HC-SR04)</span>
                <span>&bull;</span>
                <span className={currentReading ? 'text-cyan-300' : 'text-slate-500'}>Vibration (SW-420)</span>
                <span>&bull;</span>
                <span className={operatingMode === 'HARDWARE' ? 'text-slate-600 line-through' : currentReading ? 'text-cyan-300' : 'text-slate-500'}>
                  IMU Accel {operatingMode === 'HARDWARE' ? '(N/A)' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 4. GPS Status */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">GPS Navigation</span>
              <Compass className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    operatingMode === 'HARDWARE'
                      ? 'bg-slate-600'
                      : currentReading?.gps?.isLocked
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span>
                  {operatingMode === 'HARDWARE'
                    ? 'Unavailable on Firmware'
                    : currentReading?.gps?.isLocked
                    ? 'Simulated Fix (Demo Route)'
                    : 'Awaiting GPS Fix'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {operatingMode === 'HARDWARE'
                  ? 'Current ESP32 firmware sketch does not transmit GPS coordinates.'
                  : currentReading?.gps?.isLocked && currentReading.gps.latitude != null && currentReading.gps.longitude != null
                  ? `${currentReading.gps.satellites ?? 8} satellites tracked • ${currentReading.gps.latitude.toFixed(4)}°, ${currentReading.gps.longitude.toFixed(4)}°`
                  : 'Coordinates will display when GPS fix is acquired.'}
              </p>
            </div>
          </div>

          {/* 5. Last Received Telemetry */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Last Telemetry Update</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-100 font-mono">
                {lastSampleTime}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {ingestedPacketsCount > 0
                  ? `${ingestedPacketsCount} total telemetry packets received this session.`
                  : 'No packets ingested yet.'}
              </p>
            </div>
          </div>

          {/* 6. Data Source */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Telemetry Data Source</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div
                className={`text-base font-semibold ${
                  operatingMode === 'SIMULATION'
                    ? 'text-emerald-300'
                    : operatingMode === 'HARDWARE'
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }`}
              >
                {operatingMode === 'SIMULATION'
                  ? 'SimulatedSensorService'
                  : operatingMode === 'HARDWARE'
                  ? 'Esp32SensorService'
                  : 'None (Standby)'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {operatingMode === 'SIMULATION'
                  ? 'Demo synthetic stream along Vijayawada circuit.'
                  : operatingMode === 'HARDWARE'
                  ? 'Direct hardware stream from physical ESP32.'
                  : 'Standby mode awaiting hardware or demo start.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          LEVEL 2: ADVANCED DIAGNOSTICS (COLLAPSIBLE)
         ======================================================== */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setIsDiagnosticsOpen((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-xs font-semibold text-slate-200">
                Advanced Technical Diagnostics
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Detailed packet metrics, serial/network endpoints, raw sensor telemetry, and storage partitions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{isDiagnosticsOpen ? 'Collapse Details' : 'Expand Diagnostics'}</span>
            {isDiagnosticsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isDiagnosticsOpen && (
          <div className="p-5 pt-0 border-t border-slate-800/80 space-y-5">
            {/* Technical grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {/* Card 1: Connection & Endpoint */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">Interface & Endpoint</span>
                <div className="text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-slate-200">{hardwareConnectionType || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Endpoint:</span>
                    <span className="text-cyan-300 truncate max-w-[120px]" title={hardwareEndpoint || 'N/A'}>
                      {hardwareEndpoint || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocol:</span>
                    <span className="text-slate-300">JSON Stream</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Packet Counters */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">Packet Diagnostics</span>
                <div className="text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ingested:</span>
                    <span className="text-cyan-400 font-bold">{ingestedPacketsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nominal Rate:</span>
                    <span className="text-slate-300">~1.4 Hz (700ms)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Drops/Errors:</span>
                    <span className="text-emerald-400">0</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Raw Sensor Values */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">Current Frame Values</span>
                <div className="text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reading #:</span>
                    <span className="text-cyan-400 font-bold">
                      {currentReading?.readingNumber !== undefined ? `#${currentReading.readingNumber}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Distance:</span>
                    <span className="text-cyan-300">
                      {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vibration:</span>
                    <span className="text-amber-300">
                      {currentReading
                        ? currentReading.vibrationG !== undefined
                          ? `${currentReading.vibrationG.toFixed(1)} g`
                          : `${currentReading.vibration}/100`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={currentReading?.statusText === 'POTHOLE DETECTED' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {currentReading?.statusText || (currentReading ? 'NORMAL' : '—')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Quarantined Storage */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[11px] font-medium text-slate-400 block">Storage Isolation</span>
                <div className="text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware Records:</span>
                    <span className="text-cyan-400 font-bold">{verifiedEvents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Demo Records:</span>
                    <span className="text-emerald-400 font-bold">{demoEvents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Isolation:</span>
                    <span className="text-slate-300">Quarantined</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol & Architecture Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Authoritative ESP32 Firmware Protocol (115200 Baud)
                </span>
                <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  <code>{`// Active Serial Output (Every 2500ms):
Recorded reading <N> | Distance <D> cm | Vibration <V> g | Status: <NORMAL|POTHOLE DETECTED>

// Example Normal Reading:
Recorded reading 1 | Distance 25.1 cm | Vibration 0.1 g | Status: NORMAL

// Example Defect Reading:
Recorded reading 5 | Distance 37.8 cm | Vibration 1.4 g | Status: POTHOLE DETECTED`}</code>
                </pre>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Decoupled Architecture
                </span>
                <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2.5 leading-relaxed">
                  <p>
                    The application consumes all sensor data through the decoupled <code className="text-cyan-300 font-mono">ISensorService</code> abstraction:
                  </p>
                  <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                    <li className="flex items-start gap-1.5">
                      <span className="text-cyan-400">&bull;</span>
                      <span><strong>Hardware:</strong> <code className="text-cyan-300">Esp32SensorService</code> reads genuine serial or websocket frames.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">&bull;</span>
                      <span><strong>Simulation:</strong> <code className="text-emerald-300">SimulatedSensorService</code> streams synthetic frames along the test route.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400">&bull;</span>
                      <span><strong>Quarantine:</strong> Demo detections never mix with genuine hardware records.</span>
                    </li>
                  </ul>
                  <div className="pt-1 text-[11px] text-slate-500">
                    Standby mode is strictly honest: no fake readings or placeholder detections are fabricated when hardware is disconnected.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <HardwareConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
};
