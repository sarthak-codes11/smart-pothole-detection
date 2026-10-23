import React from 'react';
import {
  Activity,
  CheckCircle2,
  Sparkles,
  Play,
  Pause,
  LogOut,
  Cpu,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { HardwareConnectModal } from './HardwareConnectModal';

export const Header: React.FC = () => {
  const {
    operatingMode,
    analysisState,
    hardwareStatus,
    hardwareConnectionType,
    startAnalysis,
    stopAnalysis,
    isConnectModalOpen,
    setIsConnectModalOpen,
    exitSimulationDemo,
  } = useSystem();

  const handleStartAnalysis = () => {
    if (operatingMode === 'STANDBY' && hardwareStatus !== 'CONNECTED') {
      setIsConnectModalOpen(true);
      return;
    }
    startAnalysis();
  };

  return (
    <>
      <header className="bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand & Single Compact Operating Mode Indicator */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-sm font-semibold text-slate-100 tracking-tight truncate">
                Smart Road Health Monitoring
              </h1>

              {/* Single Compact Operating Mode Indicator */}
              {operatingMode === 'SIMULATION' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Demo Mode</span>
                </span>
              ) : operatingMode === 'HARDWARE' && hardwareStatus === 'CONNECTED' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Hardware Connected ({hardwareConnectionType})</span>
                </span>
              ) : operatingMode === 'HARDWARE' && hardwareStatus === 'AWAITING_TELEMETRY' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>Awaiting Telemetry ({hardwareConnectionType})</span>
                </span>
              ) : operatingMode === 'HARDWARE' && hardwareStatus === 'CONNECTION_LOST' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/25 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Connection Lost</span>
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  <span>Standby</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Exit Demo button (only visible during simulation mode) */}
            {operatingMode === 'SIMULATION' && (
              <button
                onClick={exitSimulationDemo}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors flex items-center gap-1.5"
                title="Exit simulation demo and return to standby"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Exit Demo</span>
              </button>
            )}

            {/* Primary Connection / Demo Modal Trigger */}
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                hardwareStatus === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                  : 'bg-slate-800/80 text-cyan-300 border-slate-700/80 hover:border-cyan-500/40 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {hardwareStatus === 'CONNECTED'
                  ? 'ESP32 Connected'
                  : hardwareStatus === 'AWAITING_TELEMETRY'
                  ? 'Awaiting ESP32'
                  : 'Connect / Demo'}
              </span>
            </button>

            {/* Single Context-Aware Analysis Control */}
            {analysisState === 'RUNNING' ? (
              <button
                onClick={stopAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
                title="Pause real-time detection analysis"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Analysis</span>
              </button>
            ) : analysisState === 'PAUSED' ? (
              <button
                onClick={startAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                title="Resume real-time detection analysis"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Analysis</span>
              </button>
            ) : (
              <button
                onClick={handleStartAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-colors"
                title={operatingMode === 'STANDBY' ? 'Connect ESP32 or start demo to begin analysis' : 'Start detection analysis'}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Analysis</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hardware Connection & Mode Modal */}
      <HardwareConnectModal />
    </>
  );
};
