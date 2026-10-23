import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Activity,
  Sparkles,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const SimulationControlView: React.FC = () => {
  const {
    isStreamRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    triggerScenario,
    sequenceState,
    startDemoMode,
    isDemoMode,
    currentReading,
  } = useSystem();

  const phases = [
    { num: 1, label: 'Baseline', desc: 'Ground clearance ~21cm' },
    { num: 2, label: 'Approach', desc: 'Approaching road cavity' },
    { num: 3, label: 'Distance Drop', desc: 'HC-SR04 depth spike' },
    { num: 4, label: 'Vertical Jerk', desc: 'MPU-9250 Z-accel spike' },
    { num: 5, label: 'Vibration', desc: 'SW-420 chassis shock' },
    { num: 6, label: 'Sensor Fusion', desc: 'Rule matrix evaluation' },
    { num: 7, label: 'GPS Tagging', desc: 'Coordinate & speed log' },
    { num: 8, label: 'State Sync', desc: 'Road health recalculated' },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Top Controls Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Sensor Simulation Controls</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trigger controlled physical scenarios to test the pothole detection pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isStreamRunning ? (
              <button
                onClick={pauseSimulation}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Stream
              </button>
            ) : (
              <button
                onClick={startSimulation}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Stream
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-750 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={startDemoMode}
              disabled={isDemoMode}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto Demo
            </button>
          </div>
        </div>

        {/* 5 Scenario Buttons */}
        <div className="mt-4">
          <span className="text-[11px] font-medium text-slate-400 block mb-2.5">Select Road Scenario:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* 1. Normal Road */}
            <button
              onClick={() => triggerScenario('normal')}
              className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                <span>Normal Road</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Distance ~21 cm, 1G equilibrium, low vibration.
              </p>
            </button>

            {/* 2. Rough Road */}
            <button
              onClick={() => triggerScenario('rough')}
              className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between text-xs font-medium text-amber-400">
                <span>Rough Road</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Surface cracks, medium vibration (35–50).
              </p>
            </button>

            {/* 3. Small Pothole */}
            <button
              onClick={() => triggerScenario('small')}
              className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between text-xs font-medium text-cyan-300">
                <span>Small Pothole</span>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Distance ~28 cm, mild shock (14 m/s²), Low severity.
              </p>
            </button>

            {/* 4. Medium Pothole */}
            <button
              onClick={() => triggerScenario('medium')}
              className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between text-xs font-medium text-amber-300">
                <span>Medium Pothole</span>
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Distance ~35 cm, shock (17 m/s²), Medium severity.
              </p>
            </button>

            {/* 5. Severe Pothole */}
            <button
              onClick={() => triggerScenario('severe')}
              className="p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 transition-colors text-left"
            >
              <div className="flex items-center justify-between text-xs font-medium text-rose-400">
                <span>Severe Pothole</span>
                <AlertOctagon className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cavity &gt;48 cm, vertical spike (22 m/s²), High severity.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* 8-Phase Pipeline Visualizer */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200">
              8-Phase Detection Pipeline Sequence
            </h3>
          </div>
          {sequenceState.isActive && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Active: {sequenceState.sequenceName}
            </span>
          )}
        </div>

        {/* Phase Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 my-4">
          {phases.map((p) => {
            const isCurrent = sequenceState.isActive && sequenceState.phase === p.num;
            const isCompleted = sequenceState.isActive && sequenceState.phase > p.num;

            return (
              <div
                key={p.num}
                className={`p-2.5 rounded-lg border transition-colors ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-400 text-slate-100'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={isCurrent ? 'font-bold text-cyan-300' : ''}>P{p.num}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <div className="text-xs font-medium mt-1 leading-tight">{p.label}</div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Active Phase Callout */}
        <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-cyan-400 font-bold">[{sequenceState.phase || 0}/8]</span>
            <span className="text-slate-300">{sequenceState.phaseTitle}:</span>
            <span className="text-slate-400">{sequenceState.phaseDescription}</span>
          </div>
          <div className="font-mono text-slate-400 shrink-0 text-[11px]">
            Speed: <span className="text-cyan-400 font-bold">{currentReading.gps.speed} km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
