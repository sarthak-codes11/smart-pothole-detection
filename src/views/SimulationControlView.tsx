import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Cpu,
  Trash2,
  Download,
  Info,
  Play,
  Pause,
  Wifi,
  WifiOff,
  Cable,
  Loader2,
  Sparkles,
  Zap,
  Activity,
  Compass,
  ArrowRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const SimulationControlView: React.FC = () => {
  const {
    operatingMode,
    analysisState,
    isAnalyzing,
    currentReading,
    sequenceState,
    ingestedPacketsCount,
    demoEvents,
    verifiedEvents,
    hardwareStatus,
    hardwareConnectionType,
    quarantineNotice,
    dismissQuarantineNotice,
    launchSimulationDemo,
    exitSimulationDemo,
    connectHardware,
    disconnectHardware,
    startAnalysis,
    stopAnalysis,
    triggerScenario,
    clearDemoSession,
    clearVerifiedEvents,
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'WEBSOCKET' | 'SERIAL'>('WEBSOCKET');
  const [wsUrl, setWsUrl] = useState('ws://192.168.4.1:81');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [activeScenarioTriggered, setActiveScenarioTriggered] = useState<string | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Confirmation modal state for destructive actions
  const [confirmModal, setConfirmModal] = useState<{
    type: 'DEMO' | 'VERIFIED';
    title: string;
    description: string;
    actionLabel: string;
  } | null>(null);

  const handleConnect = async () => {
    setStatusMsg(null);
    try {
      if (activeTab === 'WEBSOCKET') {
        await connectHardware('WEBSOCKET', wsUrl.trim());
      } else {
        await connectHardware('SERIAL');
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Connection failed. Please check ESP32 power and port/network settings.');
    }
  };

  const handleScenarioClick = (scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe') => {
    triggerScenario(scenario);
    setActiveScenarioTriggered(scenario);
    setTimeout(() => setActiveScenarioTriggered(null), 1800);
  };

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

  const handleExportDemoJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(demoEvents, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `simulated_demo_events_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVerifiedJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(verifiedEvents, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `verified_hardware_events_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeConfirmedAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'DEMO') {
      clearDemoSession();
    } else {
      clearVerifiedEvents();
    }
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Quarantine Alert Banner */}
      {quarantineNotice && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{quarantineNotice}</span>
          </div>
          <button
            onClick={dismissQuarantineNotice}
            className="px-2.5 py-1 bg-amber-500/20 rounded-lg hover:bg-amber-500/30 transition-colors text-amber-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            Hardware & Demo Controls
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage physical ESP32 connectivity, live analysis execution, simulation scenarios, and data storage.
          </p>
        </div>

        {/* Current Mode Badge + Toggle */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
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
            Mode: {operatingMode}
          </span>

          {operatingMode === 'SIMULATION' ? (
            <button
              onClick={exitSimulationDemo}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              Exit Demo
            </button>
          ) : (
            <button
              onClick={launchSimulationDemo}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Start Demo
            </button>
          )}
        </div>
      </div>

      {/* Grid: Section 1 (Connection) & Section 2 (Analysis) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ========================================================
            SECTION 1: HARDWARE CONNECTION
           ======================================================== */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-semibold text-slate-200">1. Hardware Connection</h2>
              </div>
              {hardwareStatus === 'CONNECTED' ? (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected ({hardwareConnectionType})
                </span>
              ) : hardwareStatus === 'CONNECTING' ? (
                <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Disconnected
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2.5">
              Connect to your physical ESP32 MCU over Wi-Fi WebSocket or browser USB Serial.
            </p>

            {/* Protocol Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 mt-3.5">
              <button
                type="button"
                onClick={() => setActiveTab('WEBSOCKET')}
                className={`py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'WEBSOCKET'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                Wi-Fi WebSocket
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SERIAL')}
                className={`py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'SERIAL'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cable className="w-3.5 h-3.5" />
                USB Serial
              </button>
            </div>

            {/* Input fields */}
            <div className="mt-3.5">
              {activeTab === 'WEBSOCKET' ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 font-medium">
                    ESP32 WebSocket URL
                  </label>
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://192.168.4.1:81"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Connect your device to the ESP32 Wi-Fi AP or same local network.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-medium text-cyan-300">USB Web Serial (115,200 Baud)</div>
                  <p className="text-[11px] text-slate-400">
                    Supported in Chrome, Edge, and Chromium browsers. Clicking connect opens the native COM port selector.
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {statusMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{statusMsg}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-2">
            {hardwareStatus === 'CONNECTED' ? (
              <button
                type="button"
                onClick={disconnectHardware}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-950/60 transition-colors flex items-center justify-center gap-2"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Disconnect Hardware
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={hardwareStatus === 'CONNECTING'}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {hardwareStatus === 'CONNECTING' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Connecting to ESP32...
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    Connect Physical ESP32
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            SECTION 2: REAL-TIME ANALYSIS
           ======================================================== */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-semibold text-slate-200">2. Real-Time Analysis</h2>
              </div>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                  analysisState === 'RUNNING'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : analysisState === 'PAUSED'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    analysisState === 'RUNNING'
                      ? 'bg-emerald-400 animate-pulse'
                      : analysisState === 'PAUSED'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                Engine: {analysisState}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2.5">
              Multi-sensor fusion engine evaluates ultrasonic, vertical accelerometer, and vibration frames.
            </p>

            {/* Diagnostic stats */}
            <div className="mt-3.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Telemetry Packets Ingested:</span>
                <span className="text-cyan-400 font-bold">{ingestedPacketsCount}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Current Data Source:</span>
                <span
                  className={
                    operatingMode === 'SIMULATION'
                      ? 'text-emerald-300'
                      : operatingMode === 'HARDWARE'
                      ? 'text-cyan-300'
                      : 'text-slate-500'
                  }
                >
                  {operatingMode === 'SIMULATION'
                    ? 'SimulatedSensorService (Demo)'
                    : operatingMode === 'HARDWARE'
                    ? `Esp32SensorService (${hardwareConnectionType || 'Hardware'})`
                    : 'None (Standby)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Detection Matrix:</span>
                <span className="text-slate-300 font-sans">Ultrasonic (40%) + Accel (40%) + Vib (20%)</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            {isAnalyzing ? (
              <button
                type="button"
                onClick={stopAnalysis}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause Real-Time Analysis
              </button>
            ) : (
              <button
                type="button"
                onClick={startAnalysis}
                className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Real-Time Analysis
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 3: DEMO SCENARIOS
         ======================================================== */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-slate-200">3. Demonstration Scenarios</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject repeatable road anomalies to test multi-sensor fusion without physical hardware.
            </p>
          </div>

          {operatingMode === 'SIMULATION' ? (
            <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Route Phase {sequenceState.phase || 1} of {sequenceState.totalPhases || 8}: {sequenceState.phaseTitle || 'Patrol Loop'}
            </span>
          ) : (
            <button
              onClick={launchSimulationDemo}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline self-start sm:self-auto"
            >
              Start Demo to Enable Triggers &rarr;
            </button>
          )}
        </div>

        {/* 5 Scenario Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Normal Road */}
          <button
            onClick={() => handleScenarioClick('normal')}
            disabled={operatingMode !== 'SIMULATION'}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeScenarioTriggered === 'normal'
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/40'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-emerald-400">Normal Road</span>
                <span className="text-[10px] font-mono text-slate-500">Baseline</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Smooth asphalt. Stable 20cm distance, 1.0g z-axis, vibration &lt; 15.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span>Trigger Baseline</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* 2. Rough Surface */}
          <button
            onClick={() => handleScenarioClick('rough')}
            disabled={operatingMode !== 'SIMULATION'}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeScenarioTriggered === 'rough'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-400">Rough Surface</span>
                <span className="text-[10px] font-mono text-slate-500">Uneven</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vibration spike (35–45) with normal distance. Validates non-pothole rejection.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <span>Trigger Rough</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* 3. Small Pothole */}
          <button
            onClick={() => handleScenarioClick('small')}
            disabled={operatingMode !== 'SIMULATION'}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeScenarioTriggered === 'small'
                ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-cyan-400">Small Pothole</span>
                <span className="text-[10px] font-mono text-slate-500">Minor</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                26cm drop + 1.35g z-spike + vibration 45. Low-severity classification.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <span>Inject Minor</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* 4. Medium Pothole */}
          <button
            onClick={() => handleScenarioClick('medium')}
            disabled={operatingMode !== 'SIMULATION'}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeScenarioTriggered === 'medium'
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-500/40'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-amber-400">Medium Pothole</span>
                <span className="text-[10px] font-mono text-slate-500">Moderate</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                32cm ultrasonic reading + 1.85g vertical impact spike + vibration 65.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <span>Inject Moderate</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          {/* 5. Severe Crater */}
          <button
            onClick={() => handleScenarioClick('severe')}
            disabled={operatingMode !== 'SIMULATION'}
            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
              activeScenarioTriggered === 'severe'
                ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-500/40'
                : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-950'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-rose-400">Severe Crater</span>
                <span className="text-[10px] font-mono text-slate-500">Critical</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                40cm drop + 2.50g violent impact spike + vibration 85. High-severity hazard.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-rose-400 flex items-center gap-1">
              <span>Inject Critical</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* Route Progress indicator */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Demo Patrol Circuit (Vijayawada Test Route)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {operatingMode === 'SIMULATION' && currentReading?.gps?.latitude != null && currentReading?.gps?.longitude != null ? (
                `${currentReading.gps.latitude.toFixed(4)}° N, ${currentReading.gps.longitude.toFixed(4)}° E`
              ) : (
                'Route inactive'
              )}
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width:
                  operatingMode === 'SIMULATION'
                    ? `${Math.round(((sequenceState.phase || 1) / (sequenceState.totalPhases || 8)) * 100)}%`
                    : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 4: DATA MANAGEMENT & STORAGE
         ======================================================== */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-semibold text-slate-200">4. Data Management & Storage</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified hardware data and demo session records are quarantined in strictly separate storage namespaces.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Isolated Storage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Demo Session Storage */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Demo Session Storage
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {demoEvents.length} events
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Contains synthetic anomalies recorded during the current demo session. Cleared automatically or on demand.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExportDemoJSON}
                disabled={demoEvents.length === 0}
                className="flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export JSON
              </button>
              <button
                onClick={() =>
                  setConfirmModal({
                    type: 'DEMO',
                    title: 'Clear Demo Session?',
                    description: `This will remove all ${demoEvents.length} simulated detections from the current demo session. Verified hardware records will remain unaffected.`,
                    actionLabel: 'Clear Demo Session',
                  })
                }
                disabled={demoEvents.length === 0}
                className="flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium bg-slate-800 text-amber-300 border-slate-700 hover:bg-amber-950/30 hover:border-amber-800/40 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                Clear Session
              </button>
            </div>
          </div>

          {/* Verified Hardware Storage */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Verified Hardware Storage
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  {verifiedEvents.length} events
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Contains genuine road defects detected and confirmed by physical ESP32 telemetry. Stored permanently.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleExportVerifiedJSON}
                disabled={verifiedEvents.length === 0}
                className="flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                Export JSON
              </button>
              <button
                onClick={() =>
                  setConfirmModal({
                    type: 'VERIFIED',
                    title: 'Purge Verified Hardware Records?',
                    description: `This will permanently delete all ${verifiedEvents.length} verified physical defect records from local storage. This action cannot be undone.`,
                    actionLabel: 'Permanently Purge',
                  })
                }
                disabled={verifiedEvents.length === 0}
                className="flex-1 py-1.5 px-3 rounded-lg border text-xs font-medium bg-slate-800 text-rose-300 border-slate-700 hover:bg-rose-950/30 hover:border-rose-800/40 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Purge Storage
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 5: ADVANCED DIAGNOSTICS (COLLAPSIBLE)
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
                5. Advanced Diagnostics & Protocol Schema
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Inspect raw ESP32 JSON schema contract and technical telemetry specifications.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{isDiagnosticsOpen ? 'Hide Diagnostics' : 'Show Diagnostics'}</span>
            {isDiagnosticsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isDiagnosticsOpen && (
          <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Unified Telemetry JSON Contract
                </span>
                <p className="text-[11px] text-slate-400 mb-2">
                  Both real ESP32 frames and the simulation demo stream conform to this exact contract:
                </p>
                <pre className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  <code>{esp32JsonSchema}</code>
                </pre>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Active Frame Telemetry Values
                </span>
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Ultrasonic Distance:</span>
                    <span className="text-cyan-300">
                      {currentReading ? `${currentReading.ultrasonicDistance.toFixed(1)} cm` : 'No frame'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Vertical Accel (Z):</span>
                    <span className="text-slate-200">
                      {currentReading?.acceleration?.z != null ? `${currentReading.acceleration.z.toFixed(2)} m/s²` : 'No frame'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Vibration Level:</span>
                    <span className="text-amber-300">
                      {currentReading ? `${currentReading.vibration} / 100` : 'No frame'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <span className="text-slate-300 text-[11px]">
                      {currentReading && currentReading.gps?.isLocked && currentReading.gps.latitude != null && currentReading.gps.longitude != null
                        ? `${currentReading.gps.latitude.toFixed(5)}, ${currentReading.gps.longitude.toFixed(5)}`
                        : 'No valid GPS fix'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Frame Timestamp:</span>
                    <span className="text-slate-400 text-[11px]">
                      {currentReading ? new Date(currentReading.timestamp).toISOString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[11px] text-slate-400 leading-relaxed">
                  <div className="font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Strict Decoupled Interface
                  </div>
                  Hardware connectivity communicates through the <code className="text-cyan-300 font-mono">ISensorService</code> abstraction layer. If an ESP32 disconnects, the system returns cleanly to Standby without ever synthesizing fake data.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'VERIFIED'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Destructive Storage Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors shadow-sm ${
                  confirmModal.type === 'VERIFIED'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
