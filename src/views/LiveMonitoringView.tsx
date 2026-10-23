import React from 'react';
import {
  Radio,
  Activity,
  Compass,
  Navigation,
  Cpu,
  Zap,
  Play,
  Pause,
  CheckCircle2,
  Signal,
  Sparkles,
  LogOut,
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
  const {
    currentReading,
    telemetryHistory,
    detectionResult,
    hardwareStatus,
    hardwareConnectionType,
    operatingMode,
    analysisState,
    isAnalyzing,
    ingestedPacketsCount,
    startAnalysis,
    stopAnalysis,
    exitSimulationDemo,
    setIsConnectModalOpen,
  } = useSystem();

  const isHardware = operatingMode === 'HARDWARE';
  const isConnectionLost = hardwareStatus === 'CONNECTION_LOST';

  const formattedChartData = telemetryHistory.map((item, idx) => ({
    index: idx,
    time: item.timestamp.slice(14, 19),
    distance: item.ultrasonicDistance,
    accelZ: item.acceleration?.z ?? null,
    vibration: item.vibrationG !== undefined ? item.vibrationG : item.vibration,
    vibrationG: item.vibrationG,
    readingNumber: item.readingNumber,
    statusText: item.statusText,
  }));

  const isDistAnomaly = Boolean(
    currentReading &&
    (currentReading.statusText === 'POTHOLE DETECTED' || currentReading.ultrasonicDistance > 30.0)
  );
  const isAccelAnomaly = Boolean(
    !isHardware && currentReading && currentReading.acceleration?.z && Math.abs(currentReading.acceleration.z - 9.81) > 3.5
  );
  const isVibAnomaly = Boolean(
    currentReading &&
    (currentReading.statusText === 'POTHOLE DETECTED' ||
      (currentReading.vibrationG !== undefined ? currentReading.vibrationG > 0.8 : currentReading.vibration > 40))
  );

  const lastReceivedTime = currentReading?.timestamp
    ? new Date(currentReading.timestamp).toLocaleTimeString()
    : '—';

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Page Header & Live Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Signal className="w-5 h-5 text-cyan-400" />
            Live Telemetry & Fusion Analysis
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isHardware
              ? 'Real-time telemetry stream from physical ESP32 via USB Web Serial (115200 baud).'
              : 'Multi-sensor telemetry stream from ultrasonic distance, 9-DoF IMU, and piezo vibration sensors.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {operatingMode === 'SIMULATION' && (
            <button
              onClick={exitSimulationDemo}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span>Exit Demo</span>
            </button>
          )}

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isHardware && hardwareStatus === 'CONNECTED' ? 'ESP32 Settings' : 'Connection Options'}</span>
          </button>

          {analysisState === 'RUNNING' ? (
            <button
              onClick={stopAnalysis}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Analysis</span>
            </button>
          ) : (
            <button
              onClick={startAnalysis}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{analysisState === 'PAUSED' ? 'Resume Analysis' : 'Start Analysis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stream Status Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs ${
              operatingMode === 'SIMULATION'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : operatingMode === 'HARDWARE'
                ? hardwareStatus === 'CONNECTED'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                operatingMode === 'SIMULATION'
                  ? 'bg-emerald-400 animate-pulse'
                  : operatingMode === 'HARDWARE'
                  ? hardwareStatus === 'CONNECTED'
                    ? 'bg-cyan-400 animate-pulse'
                    : hardwareStatus === 'AWAITING_TELEMETRY'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                  : 'bg-slate-500'
              }`}
            />
            Mode: {operatingMode}
            {isHardware && (
              <span className="text-[10px] opacity-80">
                ({hardwareStatus === 'CONNECTED'
                  ? 'Receiving Telemetry'
                  : hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'Awaiting First Line'
                  : hardwareStatus === 'CONNECTION_LOST'
                  ? 'Connection Lost'
                  : 'Connecting'})
              </span>
            )}
          </span>

          <span
            className={`font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs ${
              analysisState === 'RUNNING'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : analysisState === 'PAUSED'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Analysis: {analysisState}
          </span>

          {currentReading?.readingNumber !== undefined && (
            <span className="font-mono px-2.5 py-1 rounded-lg border bg-cyan-950/40 border-cyan-500/30 text-cyan-300 text-xs">
              Reading #{currentReading.readingNumber}
            </span>
          )}

          <span
            className={`font-mono px-2.5 py-1 rounded-lg border text-xs font-semibold ${
              detectionResult.isPotholeConfirmed
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : currentReading
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            Road Status: {detectionResult.isPotholeConfirmed ? 'Pothole Detected' : currentReading ? 'Normal Road' : 'Awaiting Telemetry'}
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span>Last Received: <strong className="text-slate-200">{lastReceivedTime}</strong></span>
          <span>•</span>
          <span>Packets: <strong className="text-cyan-400">{ingestedPacketsCount}</strong></span>
        </div>
      </div>

      {/* Disconnection Warning Banner if Telemetry Dropped */}
      {isHardware && isConnectionLost && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            <span>
              <strong>Hardware Telemetry Stale / Disconnected:</strong> Serial connection dropped. Retaining {formattedChartData.length} previously received historical readings. Reconnect to resume live streaming.
            </span>
          </div>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded font-semibold text-[11px] border border-rose-500/40 transition-colors shrink-0"
          >
            Reconnect ESP32
          </button>
        </div>
      )}

      {/* 5 Sensor Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Ultrasonic Sensor */}
        <div className={`p-4 rounded-xl border transition-colors ${
          isDistAnomaly ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ultrasonic (HC-SR04)</span>
            <Radio className={`w-4 h-4 ${isDistAnomaly ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {currentReading ? (
                <>
                  {currentReading.ultrasonicDistance.toFixed(1)} <span className="text-xs font-normal text-slate-400">cm</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal text-sm">—</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status:</span>
              <span className={`font-medium ${
                !currentReading
                  ? 'text-slate-500'
                  : isDistAnomaly
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {!currentReading ? 'Awaiting telemetry' : isDistAnomaly ? 'Irregularity' : 'Nominal'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. MPU-9250 Accelerometer */}
        <div className={`p-4 rounded-xl border transition-colors ${
          isHardware
            ? 'bg-slate-900/30 border-slate-800/50 opacity-60'
            : isAccelAnomaly
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Accel Z (MPU-9250)</span>
            <Activity className={`w-4 h-4 ${isHardware ? 'text-slate-600' : isAccelAnomaly ? 'text-rose-400' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className={`text-xl font-bold font-mono ${isAccelAnomaly ? 'text-rose-400' : 'text-slate-100'}`}>
              {isHardware ? (
                <span className="text-slate-500 font-normal text-sm">Unavailable</span>
              ) : currentReading && currentReading.acceleration?.z ? (
                <>
                  {currentReading.acceleration.z.toFixed(2)} <span className="text-xs font-normal text-slate-400">m/s²</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal text-sm">—</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Hardware Note:</span>
              <span className="text-slate-400 font-mono text-[10px]">
                {isHardware ? 'Not sent by firmware' : currentReading?.acceleration?.x ? `${currentReading.acceleration.x.toFixed(1)}, ${currentReading.acceleration.y?.toFixed(1)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. MPU-9250 Gyroscope */}
        <div className={`p-4 rounded-xl border ${
          isHardware ? 'bg-slate-900/30 border-slate-800/50 opacity-60' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Gyro (MPU-9250)</span>
            <Compass className={`w-4 h-4 ${isHardware ? 'text-slate-600' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {isHardware ? (
                <span className="text-slate-500 font-normal text-sm">Unavailable</span>
              ) : currentReading && currentReading.gyroscope?.z ? (
                <>
                  {currentReading.gyroscope.z.toFixed(2)} <span className="text-xs font-normal text-slate-400">°/s</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal text-sm">—</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Hardware Note:</span>
              <span className="text-slate-400 font-mono text-[10px]">
                {isHardware ? 'Not sent by firmware' : currentReading?.gyroscope?.x ? `${currentReading.gyroscope.x.toFixed(1)}°, ${currentReading.gyroscope.y?.toFixed(1)}°` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. SW-420 Vibration */}
        <div className={`p-4 rounded-xl border transition-colors ${
          isVibAnomaly ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Vibration (SW-420)</span>
            <Zap className={`w-4 h-4 ${isVibAnomaly ? 'text-amber-400' : 'text-cyan-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {currentReading ? (
                currentReading.vibrationG !== undefined ? (
                  <>
                    {currentReading.vibrationG.toFixed(1)} <span className="text-xs font-normal text-slate-400">g</span>
                  </>
                ) : (
                  <>
                    {currentReading.vibration} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </>
                )
              ) : (
                <span className="text-slate-500 font-normal text-sm">—</span>
              )}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  !currentReading
                    ? 'w-0'
                    : isVibAnomaly
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: currentReading
                    ? currentReading.vibrationG !== undefined
                      ? `${Math.min(100, (currentReading.vibrationG / 2.0) * 100)}%`
                      : `${Math.min(100, currentReading.vibration)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>

        {/* 5. NEO-6M GPS */}
        <div className={`p-4 rounded-xl border ${
          isHardware ? 'bg-slate-900/30 border-slate-800/50 opacity-60' : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">GPS (NEO-6M)</span>
            <Navigation className={`w-4 h-4 ${isHardware ? 'text-slate-600' : 'text-emerald-400'}`} />
          </div>
          <div className="mt-2.5">
            <div className="text-xl font-bold font-mono text-slate-100">
              {isHardware ? (
                <span className="text-slate-500 font-normal text-sm">Unavailable</span>
              ) : currentReading && currentReading.gps?.isLocked && currentReading.gps.speed != null ? (
                <>
                  {currentReading.gps.speed.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal text-sm">No GPS fix</span>
              )}
            </div>
            <div className="mt-1.5 text-[10px] text-slate-400 font-mono truncate">
              {isHardware ? 'No GPS in current firmware' : currentReading && currentReading.gps?.isLocked && currentReading.gps.latitude != null && currentReading.gps.longitude != null ? `${currentReading.gps.latitude.toFixed(4)}°, ${currentReading.gps.longitude.toFixed(4)}°` : 'Awaiting satellites'}
            </div>
          </div>
        </div>
      </div>

      {/* Detection Engine Status */}
      <div className={`p-5 rounded-xl border transition-colors shadow-sm ${
        detectionResult.isPotholeConfirmed
          ? 'bg-rose-950/20 border-rose-500/30'
          : detectionResult.condition === 'POSSIBLE IRREGULARITY'
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-slate-900/60 border-slate-800/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200">
                {isHardware ? 'ESP32 Firmware Classification' : 'Sensor Fusion Matrix'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  detectionResult.isPotholeConfirmed
                    ? 'bg-rose-500 text-white'
                    : detectionResult.condition === 'POSSIBLE IRREGULARITY'
                    ? 'bg-amber-500 text-slate-950'
                    : detectionResult.condition === 'STANDBY'
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {detectionResult.condition === 'STANDBY'
                    ? 'STANDBY (AWAITING TELEMETRY)'
                    : detectionResult.isPotholeConfirmed
                    ? 'POTHOLE DETECTED'
                    : 'NORMAL ROAD'}
                </span>
                {detectionResult.severity && (
                  <span className="text-xs font-semibold text-rose-400 font-mono">
                    [{detectionResult.severity} SEVERITY]
                  </span>
                )}
                {isHardware && (
                  <span className="text-[10px] font-mono text-cyan-400/80">
                    (Authoritative ESP32 Firmware Telemetry)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-base font-bold text-cyan-400">
              {detectionResult.confidence !== null ? `${detectionResult.confidence}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isHardware ? '(Firmware validated)' : '(≥70% confirms defect event)'}
            </span>
          </div>
        </div>

        {/* Fusion Weight Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 text-[11px]">Distance Delta (HC-SR04)</span>
              <span className="font-mono font-semibold text-cyan-400">
                {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-full transition-all duration-300"
                style={{
                  width: currentReading ? `${Math.min(100, (currentReading.ultrasonicDistance / 50) * 100)}%` : '0%',
                }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 text-[11px]">
                {isHardware ? 'Vertical Accel (Firmware N/A)' : 'Vertical Accel (40%)'}
              </span>
              <span className="font-mono font-semibold text-rose-400">
                {isHardware ? 'N/A' : detectionResult.accelAnomalyContribution !== null ? `${detectionResult.accelAnomalyContribution}%` : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full transition-all duration-300"
                style={{
                  width: !isHardware && detectionResult.accelAnomalyContribution !== null
                    ? `${(detectionResult.accelAnomalyContribution / 40) * 100}%`
                    : '0%',
                }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 text-[11px]">Vibration Impact (SW-420)</span>
              <span className="font-mono font-semibold text-amber-400">
                {currentReading
                  ? currentReading.vibrationG !== undefined
                    ? `${currentReading.vibrationG.toFixed(1)} g`
                    : `${currentReading.vibration}/100`
                  : '—'}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{
                  width: currentReading
                    ? currentReading.vibrationG !== undefined
                      ? `${Math.min(100, (currentReading.vibrationG / 2.0) * 100)}%`
                      : `${Math.min(100, currentReading.vibration)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Waveform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Distance Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Distance Waveform (cm)</h3>
              <p className="text-[10px] text-slate-400">HC-SR04 ultrasonic road-surface distance</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">
              {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : 'Baseline: 25 cm'}
            </span>
          </div>
          <div className="h-48 w-full pt-2">
            {formattedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[15, 55]} />
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
                    name="Distance (cm)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#38bdf8' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 rounded-lg bg-slate-950/40 border border-dashed border-slate-800/80">
                <Radio className="w-5 h-5 text-slate-600 mb-1" />
                <span className="text-xs text-slate-400">No distance telemetry received</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isHardware ? 'Connect physical ESP32 to stream HC-SR04 telemetry' : 'Awaiting telemetry frames'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Vibration Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div>
              <h3 className="text-xs font-semibold text-slate-200">
                Vibration Waveform {isHardware ? '(g)' : '(0–100)'}
              </h3>
              <p className="text-[10px] text-slate-400">SW-420 road surface impact amplitude</p>
            </div>
            <span className="text-[10px] font-mono text-amber-400">
              {currentReading
                ? currentReading.vibrationG !== undefined
                  ? `${currentReading.vibrationG.toFixed(1)} g`
                  : `${currentReading.vibration}/100`
                : isHardware
                ? 'Threshold: >0.8 g'
                : 'Anomaly: >40'}
            </span>
          </div>
          <div className="h-48 w-full pt-2">
            {formattedChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis
                    stroke="#475569"
                    fontSize={9}
                    tickLine={false}
                    domain={isHardware ? [0, 2.5] : [0, 100]}
                  />
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
                    name={isHardware ? 'Vibration (g)' : 'Vibration'}
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#f59e0b' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 rounded-lg bg-slate-950/40 border border-dashed border-slate-800/80">
                <Zap className="w-5 h-5 text-slate-600 mb-1" />
                <span className="text-xs text-slate-400">No vibration telemetry received</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isHardware ? 'Connect physical ESP32 to stream SW-420 telemetry' : 'Awaiting sensor frames'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

