import React from 'react';
import {
  Radio,
  Activity,
  Compass,
  Navigation,
  Cpu,
  Zap,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const LiveMonitoringView: React.FC = () => {
  const { currentReading, telemetryHistory, detectionResult } = useSystem();

  const formattedChartData = telemetryHistory.map((item, idx) => ({
    index: idx,
    time: item.timestamp.slice(14, 19),
    distance: item.ultrasonicDistance,
    accelZ: item.acceleration.z,
    vibration: item.vibration,
  }));

  const isDistAnomaly = currentReading.ultrasonicDistance > 25.0;
  const isAccelAnomaly = Math.abs(currentReading.acceleration.z - 9.81) > 3.5;
  const isVibAnomaly = currentReading.vibration > 40;

  return (
    <div className="space-y-5 pb-10">
      {/* 5 Sensor Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Ultrasonic Sensor */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isDistAnomaly ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Ultrasonic (HC-SR04)</span>
            <Radio className={`w-3.5 h-3.5 ${isDistAnomaly ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {currentReading.ultrasonicDistance} <span className="text-xs font-normal text-slate-400">cm</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Status:</span>
              <span className={`font-medium px-1.5 py-0.2 rounded ${
                isDistAnomaly ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {isDistAnomaly ? 'Anomaly' : 'Normal (18–25cm)'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. MPU-9250 Accelerometer */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isAccelAnomaly ? 'bg-rose-500/10 border-rose-500/40' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Accel (MPU-9250)</span>
            <Activity className={`w-3.5 h-3.5 ${isAccelAnomaly ? 'text-rose-400' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">X / Y:</span>
              <span className="text-slate-200">{currentReading.acceleration.x.toFixed(1)}, {currentReading.acceleration.y.toFixed(1)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 font-normal">Z (Vertical):</span>
              <span className={isAccelAnomaly ? 'text-rose-400' : 'text-slate-100'}>
                {currentReading.acceleration.z.toFixed(2)} m/s²
              </span>
            </div>
          </div>
        </div>

        {/* 3. MPU-9250 Gyroscope */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Gyro (MPU-9250)</span>
            <Compass className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-2.5 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Roll / Pitch:</span>
              <span className="text-slate-200">{currentReading.gyroscope.x.toFixed(1)}°, {currentReading.gyroscope.y.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Yaw:</span>
              <span className="text-slate-200">{currentReading.gyroscope.z.toFixed(1)}°/s</span>
            </div>
          </div>
        </div>

        {/* 4. SW-420 Vibration */}
        <div className={`p-3.5 rounded-xl border transition-colors ${
          isVibAnomaly ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Vibration (SW-420)</span>
            <Zap className={`w-3.5 h-3.5 ${isVibAnomaly ? 'text-amber-400' : 'text-yellow-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {currentReading.vibration} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  currentReading.vibration > 60
                    ? 'bg-rose-500'
                    : currentReading.vibration > 30
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, currentReading.vibration)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. NEO-6M GPS */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">GPS (NEO-6M)</span>
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2.5 space-y-1 text-xs font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Coordinates:</span>
              <span className="text-slate-200">{currentReading.gps.latitude.toFixed(3)}°, {currentReading.gps.longitude.toFixed(3)}°</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Speed:</span>
              <span className="text-cyan-400 font-bold">{currentReading.gps.speed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Engine Status */}
      <div className={`p-4 rounded-xl border transition-colors ${
        detectionResult.isPotholeConfirmed
          ? 'bg-rose-950/20 border-rose-500/40'
          : detectionResult.condition === 'POSSIBLE IRREGULARITY'
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200">Detection Engine (Sensor Fusion)</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                  detectionResult.isPotholeConfirmed
                    ? 'bg-rose-500 text-white'
                    : detectionResult.condition === 'POSSIBLE IRREGULARITY'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {detectionResult.condition}
                </span>
                {detectionResult.severity && (
                  <span className="text-xs font-semibold text-rose-400 font-mono">
                    [{detectionResult.severity} SEVERITY]
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-base font-bold text-cyan-400">{detectionResult.confidence}%</span>
            <span className="text-[10px] text-slate-500">(≥70% triggers detection)</span>
          </div>
        </div>

        {/* Fusion Weight Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 text-[11px]">Distance Delta (40%)</span>
              <span className="font-mono font-semibold text-cyan-400">{detectionResult.distanceAnomalyContribution}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full"
                style={{ width: `${(detectionResult.distanceAnomalyContribution / 40) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 text-[11px]">Vertical Accel (40%)</span>
              <span className="font-mono font-semibold text-rose-400">{detectionResult.accelAnomalyContribution}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full"
                style={{ width: `${(detectionResult.accelAnomalyContribution / 40) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 text-[11px]">Vibration (20%)</span>
              <span className="font-mono font-semibold text-amber-400">{detectionResult.vibrationContribution}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${(detectionResult.vibrationContribution / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Real-time Recharts Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Distance Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200">Distance Stream (cm)</h3>
            <span className="text-[10px] font-mono text-slate-400">Normal: 18–25 cm</span>
          </div>
          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[10, 55]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="distance"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Vertical Accel Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200">Vertical Accel Z (m/s²)</h3>
            <span className="text-[10px] font-mono text-slate-400">Baseline: 9.81 m/s²</span>
          </div>
          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 25]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accelZ"
                  stroke="#fb7185"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Vibration Chart */}
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200">Vibration (0–100)</h3>
            <span className="text-[10px] font-mono text-slate-400">Pothole: &gt;60</span>
          </div>
          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="vibration"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
