import React from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const Header: React.FC = () => {
  const {
    isStreamRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    isDemoMode,
    startDemoMode,
    stopDemoMode,
    buzzerEnabled,
    toggleBuzzer,
    roadHealth,
  } = useSystem();

  return (
    <header className="bg-[#0f172a]/95 border-b border-slate-800/80 sticky top-0 z-40 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
                Smart Road Health Monitoring System
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Simulation Mode
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <WifiOff className="w-3 h-3 text-rose-400" />
                Hardware: Not Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sensor data is currently simulated. ESP32 integration will provide real-time hardware data.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Health Mini Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <span className="text-slate-400 text-[11px]">Road Health:</span>
            <span
              className={`font-semibold font-mono ${
                roadHealth.rating === 'GOOD'
                  ? 'text-emerald-400'
                  : roadHealth.rating === 'MODERATE'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {roadHealth.score}% ({roadHealth.rating})
            </span>
          </div>

          {/* Buzzer Sound Toggle */}
          <button
            onClick={toggleBuzzer}
            title={buzzerEnabled ? 'Buzzer Alert: Enabled' : 'Buzzer Alert: Muted'}
            className={`p-1.5 rounded-lg border transition-colors ${
              buzzerEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-750'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
          >
            {buzzerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Run/Pause/Reset Stream */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {isStreamRunning ? (
              <button
                onClick={pauseSimulation}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-amber-300 hover:bg-slate-800 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            ) : (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-400 hover:bg-slate-800 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume
              </button>
            )}
            <button
              onClick={resetSimulation}
              title="Reset Simulation"
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Demo Mode Button */}
          {isDemoMode ? (
            <button
              onClick={stopDemoMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              Stop Demo
            </button>
          ) : (
            <button
              onClick={startDemoMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Mode
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
