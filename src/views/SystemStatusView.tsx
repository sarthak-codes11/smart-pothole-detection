import React from 'react';
import {
  Cpu,
  Radio,
  Activity,
  Compass,
  Zap,
  Database,
  Code2,
  FileCode,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const SystemStatusView: React.FC = () => {
  const { potholeEvents } = useSystem();

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

  return (
    <div className="space-y-5 pb-10">
      {/* Subsystems Status Grid */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Subsystem & Hardware Architecture
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Service layer interface (<code className="text-cyan-300">ISensorService</code>) decouples UI from sensor stream.
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Pipeline: Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {/* 1. ESP32 MCU */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">ESP32 Dual-Core MCU</span>
              <Cpu className="w-4 h-4 text-slate-500" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Hardware:</span>
                <span className="text-rose-400 font-medium">NOT CONNECTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mode:</span>
                <span className="text-amber-300 font-medium">SIMULATION</span>
              </div>
            </div>
          </div>

          {/* 2. Ultrasonic HC-SR04 */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">HC-SR04 Ultrasonic</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="text-cyan-300 font-medium">SIMULATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Range:</span>
                <span className="text-slate-200">12–65 cm</span>
              </div>
            </div>
          </div>

          {/* 3. MPU-9250 IMU */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">MPU-9250 9-DoF IMU</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="text-cyan-300 font-medium">SIMULATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="text-slate-200">50 Hz / I2C</span>
              </div>
            </div>
          </div>

          {/* 4. NEO-6M GPS */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">NEO-6M GPS Module</span>
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="text-cyan-300 font-medium">SIMULATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fix State:</span>
                <span className="text-emerald-400 font-medium">LOCKED</span>
              </div>
            </div>
          </div>

          {/* 5. SW-420 Vibration */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">SW-420 Piezo Sensor</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="text-cyan-300 font-medium">SIMULATED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scale:</span>
                <span className="text-slate-200">0–100</span>
              </div>
            </div>
          </div>

          {/* 6. Database / LocalStorage */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200">Storage & Engine</span>
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Backend:</span>
                <span className="text-emerald-400 font-medium">LOCAL STORAGE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Records:</span>
                <span className="text-slate-200">{potholeEvents.length} Events</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware JSON Protocol & Hot-Swap Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expected ESP32 JSON */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-100">ESP32 Telemetry JSON Format</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Contract</span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] text-slate-400 mb-2">
              Hardware MCU transmits telemetry matching this JSON schema:
            </p>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto">
              <code>{esp32JsonSchema}</code>
            </pre>
          </div>
        </div>

        {/* Hot-Swap Instructions */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-100">Connecting Physical Hardware</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Modular</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <p className="text-[11px] text-slate-400">
              The application consumes data through the <code className="text-cyan-300 font-mono">ISensorService</code> abstraction:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-[11px] font-mono text-slate-300">
              <div>1. Flash ESP32 with WebSocket or Serial firmware.</div>
              <div>2. Open <code className="text-cyan-300">src/context/SystemContext.tsx</code>.</div>
              <div>3. Replace <code className="text-amber-300">SimulatedSensorService</code> with <code className="text-emerald-300">Esp32SensorService</code>.</div>
            </div>

            <div className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 text-[11px]">
              No changes to the detection engine, charts, map, or UI are needed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
