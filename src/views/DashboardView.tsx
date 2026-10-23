import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Activity,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Car,
  Navigation,
  Play,
  Pause,
  Cpu,
  Sparkles,
  LogOut,
  Radio,
  Zap,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeEvent, PotholeSeverity } from '../types';
import { PotholeDetailModal } from '../components/PotholeDetailModal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Auto-follow vehicle sub-component for dashboard map widget
const DashboardMapFollower: React.FC<{ center: [number, number] | null; follow: boolean }> = ({ center, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow && center) {
      map.panTo(center, { animate: true, duration: 0.35 });
    }
  }, [center, follow, map]);
  return null;
};

// Custom SVG vehicle icon
const createVehicleIcon = (heading: number) => {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Custom SVG pothole icon
const createPotholeIcon = (severity: PotholeSeverity, status: string) => {
  const isRepaired = status === 'REPAIRED';
  const color = isRepaired
    ? '#10b981'
    : severity === 'HIGH'
    ? '#ef4444'
    : severity === 'MEDIUM'
    ? '#f59e0b'
    : '#06b6d4';

  return L.divIcon({
    className: 'custom-pothole-marker',
    html: `
      <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 16px; height: 16px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
          <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

export const DashboardView: React.FC = () => {
  const {
    currentReading,
    telemetryHistory,
    potholeEvents,
    roadHealth,
    operatingMode,
    isAnalyzing,
    startAnalysis,
    stopAnalysis,
    hardwareStatus,
    hardwareConnectionType,
    ingestedPacketsCount,
    launchSimulationDemo,
    exitSimulationDemo,
    setIsConnectModalOpen,
    setActiveTab,
  } = useSystem();

  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);
  const [mapSeverityFilter, setMapSeverityFilter] = useState<'ALL' | PotholeSeverity>('ALL');
  const [autoFollow, setAutoFollow] = useState<boolean>(false);

  const chartData = telemetryHistory.map((item) => ({
    time: item.timestamp.slice(14, 19),
    distance: item.ultrasonicDistance,
    vibration: item.vibration,
    accelZ: item.acceleration.z,
  }));

  const mapFilteredEvents = potholeEvents.filter((e) => {
    if (mapSeverityFilter === 'ALL') return true;
    return e.severity === mapSeverityFilter;
  });

  const hasVehicleGps = Boolean(
    currentReading &&
    currentReading.gps &&
    currentReading.gps.isLocked &&
    typeof currentReading.gps.latitude === 'number' &&
    typeof currentReading.gps.longitude === 'number'
  );

  const vehiclePosition: [number, number] | null =
    hasVehicleGps && currentReading && currentReading.gps?.latitude != null && currentReading.gps?.longitude != null
      ? [currentReading.gps.latitude, currentReading.gps.longitude]
      : null;

  const isStandby = operatingMode === 'STANDBY' && hardwareStatus !== 'CONNECTED';

  return (
    <div className="space-y-5 pb-10">
      {/* SECTION A: Connection and Analysis Status */}
      {isStandby ? (
        /* Section A: Clear Onboarding Section in Standby Mode */
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0f172a] to-slate-900/80 border border-slate-800 shadow-xl">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Smart Road Health Monitoring
            </h2>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Connect your ESP32 to monitor real sensor data, or launch a demo to explore the system without hardware.
            </p>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 transition-colors flex items-center gap-2"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Connect ESP32</span>
              </button>

              <button
                onClick={launchSimulationDemo}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Try Demo</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Waiting for connection</span>
            </div>
          </div>
        </div>
      ) : (
        /* Section A: Compact Active Status Panel */
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {operatingMode === 'SIMULATION' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Mode Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hardware Connected ({hardwareConnectionType})</span>
              </span>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Status:</span>
              <span className={isAnalyzing ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                {isAnalyzing ? 'Analysis Running' : 'Analysis Paused'}
              </span>
              <span>&bull;</span>
              <span>
                {currentReading ? `Last update: ${new Date(currentReading.timestamp).toLocaleTimeString()}` : 'Awaiting telemetry'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {isAnalyzing ? (
              <button
                onClick={stopAnalysis}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Analysis</span>
              </button>
            ) : (
              <button
                onClick={startAnalysis}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Analysis</span>
              </button>
            )}

            {operatingMode === 'SIMULATION' && (
              <button
                onClick={exitSimulationDemo}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Exit Demo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Current Reading Panel (Displayed when hardware or simulation reading is active) */}
      {currentReading ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              currentReading.statusText === 'POTHOLE DETECTED'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Latest ESP32 Telemetry Frame
                </span>
                {currentReading.isPlayback && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    ESP32 Playback
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-cyan-300 font-mono">
                  Reading #{currentReading.readingNumber ?? currentReading.sequenceNumber ?? '1'}
                </span>
                <span className="text-slate-500 font-normal">&bull;</span>
                <span className="text-xs font-mono text-slate-200">
                  Distance: <strong className="text-cyan-300">{currentReading.ultrasonicDistance.toFixed(1)} cm</strong>
                </span>
                <span className="text-slate-500 font-normal">&bull;</span>
                <span className="text-xs font-mono text-slate-200">
                  Vibration: <strong className="text-amber-300">{currentReading.vibrationG != null ? currentReading.vibrationG.toFixed(1) : currentReading.vibration} g</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-left md:text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Reported Status</span>
              <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded inline-flex items-center gap-1.5 ${
                currentReading.statusText === 'POTHOLE DETECTED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {currentReading.statusText === 'POTHOLE DETECTED' ? (
                  <>
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                    <span>POTHOLE DETECTED</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NORMAL ROAD</span>
                  </>
                )}
              </span>
            </div>
            <div className="border-l border-slate-800 pl-3 text-left md:text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Data Source</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {operatingMode === 'SIMULATION' ? 'Synthetic Demo' : 'Physical ESP32'}
              </span>
            </div>
          </div>
        </div>
      ) : operatingMode === 'HARDWARE' ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              hardwareStatus === 'CONNECTION_LOST' ? 'bg-rose-500 animate-ping' : 'bg-amber-400 animate-pulse'
            }`} />
            <div>
              <span className="font-semibold text-slate-100 block">
                {hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'USB Serial Connected at 115200 Baud — Awaiting Telemetry'
                  : hardwareStatus === 'CONNECTION_LOST'
                  ? 'ESP32 Serial Connection Lost'
                  : 'ESP32 Port Opening...'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'Listening for: "Recorded reading <N> | Distance <D> cm | Vibration <V> g | Status: <STATUS>"'
                  : 'Check USB cable or reconnect via Connection Options.'}
              </span>
            </div>
          </div>
          {hardwareStatus === 'CONNECTION_LOST' && (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded text-xs font-medium transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      ) : null}

      {/* SECTION B: Key Road Health Metrics (6 Cards) */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {operatingMode === 'HARDWARE' ? 'ESP32 Hardware Metrics' : 'Key Road Health Metrics'}
            </h3>
            {operatingMode === 'SIMULATION' && (
              <span className="text-[10px] text-amber-400/90 font-medium">(Simulated Session)</span>
            )}
            {operatingMode === 'HARDWARE' && (
              <span className="text-[10px] text-cyan-400/90 font-medium">(Hardware Telemetry)</span>
            )}
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
          >
            <span>Detailed Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Distance in cm */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Distance</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1.5">
              {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : '—'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentReading ? 'Ultrasonic reading' : 'Awaiting telemetry'}
            </p>
          </div>

          {/* 2. Vibration in g */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400">Current Vibration</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1.5">
              {currentReading ? `${currentReading.vibrationG != null ? currentReading.vibrationG.toFixed(1) : currentReading.vibration} g` : '—'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentReading ? 'Firmware reported g' : 'Awaiting telemetry'}
            </p>
          </div>

          {/* 3. Latest Road Status */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Latest Status</span>
              {currentReading?.statusText === 'POTHOLE DETECTED' ? (
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="text-sm font-bold font-mono mt-1.5 truncate">
              {!currentReading ? (
                <span className="text-slate-500 font-normal">Awaiting data</span>
              ) : currentReading.statusText === 'POTHOLE DETECTED' ? (
                <span className="text-rose-400">Pothole Detected</span>
              ) : (
                <span className="text-emerald-400">Normal Road</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentReading ? `Reading #${currentReading.readingNumber ?? currentReading.sequenceNumber ?? '1'}` : 'No readings yet'}
            </p>
          </div>

          {/* 4. Total Hardware-Reported Potholes */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-400">Total Detections</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1.5">
              {potholeEvents.length}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {potholeEvents.length === 0 ? '0 defects recorded' : `${potholeEvents.length} recorded events`}
            </p>
          </div>

          {/* 5. Valid Readings Received */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400">Readings Received</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1.5">
              {ingestedPacketsCount}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {ingestedPacketsCount === 0 ? 'No readings yet' : 'Session packet count'}
            </p>
          </div>

          {/* 6. Last Reading Time */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Last Valid Reading</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-2 truncate">
              {currentReading ? new Date(currentReading.timestamp).toLocaleTimeString() : '—'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {currentReading ? 'Browser receipt time' : 'Awaiting telemetry'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION C: Live Telemetry */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Live Telemetry Waveform</h3>
          </div>

          {/* Compact Sensor Gauges */}
          <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
            <div>
              <span className="text-slate-500 text-[10px] block font-sans">Distance</span>
              <span className="text-slate-200 font-semibold">
                {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : '—'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] block font-sans">Vibration</span>
              <span className="text-amber-300 font-semibold">
                {currentReading ? `${currentReading.vibrationG != null ? currentReading.vibrationG.toFixed(1) : currentReading.vibration} g` : '—'}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] block font-sans">Vertical Accel</span>
              <span className="text-slate-200 font-semibold">
                {operatingMode === 'HARDWARE' ? (
                  <span className="text-slate-500 font-sans font-normal text-[11px]">Unavailable</span>
                ) : currentReading?.acceleration?.z != null ? (
                  `${currentReading.acceleration.z.toFixed(2)} m/s²`
                ) : (
                  '—'
                )}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 text-[10px] block font-sans">GPS Navigation</span>
              <span className={operatingMode === 'HARDWARE' ? 'text-slate-500 font-sans font-normal text-[11px]' : currentReading?.gps?.isLocked ? 'text-emerald-400' : 'text-slate-500'}>
                {operatingMode === 'HARDWARE'
                  ? 'Unavailable'
                  : currentReading?.gps?.isLocked
                  ? 'Demo Route'
                  : 'No Fix'}
              </span>
            </div>
          </div>
        </div>

        {/* Waveform Chart or Clean Empty State */}
        <div className="h-48 w-full flex items-center justify-center">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[0, 65]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="distance"
                  name="Distance (cm)"
                  stroke="#06b6d4"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#distGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="vibration"
                  name="Vibration"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#vibGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
              <Activity className="w-6 h-6 text-slate-600 mb-2" />
              <div className="text-sm font-semibold text-slate-300">No telemetry available</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Connect your ESP32 or start a demo to see sensor readings here.
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        {chartData.length > 0 && (
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span>Ultrasonic Distance (cm)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Vibration (0–100)</span>
              </span>
            </div>
            <button
              onClick={() => setActiveTab('live')}
              className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1 transition-colors"
            >
              <span>Live Monitoring View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION D: Map and Recent Detections (Balanced 2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Road Map Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Road Map</h3>
              {operatingMode === 'SIMULATION' && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                  Demo Route
                </span>
              )}
            </div>

            {/* Severity Filter Pills */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                onClick={() => setMapSeverityFilter('ALL')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  mapSeverityFilter === 'ALL'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({potholeEvents.length})
              </button>
              <button
                onClick={() => setMapSeverityFilter('HIGH')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  mapSeverityFilter === 'HIGH'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setMapSeverityFilter('MEDIUM')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  mapSeverityFilter === 'MEDIUM'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Medium
              </button>
            </div>
          </div>

          {/* Leaflet Map Widget */}
          <div className="h-72 w-full rounded-xl overflow-hidden relative border border-slate-800 mt-3 z-0">
            <MapContainer
              center={vehiclePosition || [16.5062, 80.648]}
              zoom={14}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <DashboardMapFollower center={vehiclePosition} follow={autoFollow} />

              {/* Vehicle Marker */}
              {hasVehicleGps && currentReading && currentReading.gps?.latitude != null && currentReading.gps?.longitude != null && (
                <Marker
                  position={[currentReading.gps.latitude, currentReading.gps.longitude]}
                  icon={createVehicleIcon(currentReading.gps.heading ?? 0)}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="font-semibold text-cyan-400 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5" />
                        <span>Patrol Vehicle</span>
                      </div>
                      <div className="text-slate-300 font-mono text-[11px]">
                        Speed: {(currentReading.gps.speed ?? 0).toFixed(1)} km/h
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Pothole Markers */}
              {mapFilteredEvents.map((evt) => (
                <Marker
                  key={evt.id}
                  position={[evt.latitude, evt.longitude]}
                  icon={createPotholeIcon(evt.severity, evt.status)}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs min-w-[160px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-semibold text-slate-100">{evt.id}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                          {evt.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">Depth: {evt.estimatedDepth}</div>
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="text-cyan-400 hover:text-cyan-300 text-[10px] font-medium pt-1 block"
                      >
                        View Full Details &rarr;
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* GPS Status Notice */}
            {!hasVehicleGps && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-950/85 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 font-mono flex items-center gap-2 shadow-lg">
                <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {operatingMode === 'SIMULATION'
                    ? 'Advancing along Vijayawada test circuit'
                    : 'Awaiting Hardware GPS Fix'}
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px]">
              {hasVehicleGps ? 'Vehicle position locked' : 'Showing central demonstration area'}
            </span>
            <button
              onClick={() => setActiveTab('map')}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <span>Full Screen Map</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Recent Detections Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Recent Detections</h3>
            </div>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>All History ({potholeEvents.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Detections List or Clean Empty State */}
          <div className="mt-3 space-y-2.5 min-h-[288px]">
            {potholeEvents.length > 0 ? (
              potholeEvents.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-3 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          evt.severity === 'HIGH'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : evt.severity === 'MEDIUM'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {evt.severity}
                      </span>

                      {evt.isSimulated ? (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                          DEMO
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          HW
                        </span>
                      )}

                      <span className="font-mono text-slate-300 text-xs font-medium">{evt.id}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      {evt.roadSegmentName || 'Main Corridor Sector'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-semibold text-slate-200">{evt.estimatedDepth}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-xl bg-slate-950/30 border border-dashed border-slate-800">
                <CheckCircle2 className="w-6 h-6 text-slate-600 mb-2" />
                <div className="text-sm font-medium text-slate-300">No road detections recorded yet</div>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  {operatingMode === 'SIMULATION'
                    ? 'Simulated road anomalies will appear here as the demonstration progresses.'
                    : 'Potholes detected during hardware patrols will appear here in real time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Event Detail Modal */}
      <PotholeDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};
