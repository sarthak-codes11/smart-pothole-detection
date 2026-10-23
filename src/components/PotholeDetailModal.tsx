import React, { useState } from 'react';
import {
  X,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Clock,
} from 'lucide-react';
import { PotholeEvent, PotholeStatus } from '../types';
import { useSystem } from '../context/SystemContext';

interface PotholeDetailModalProps {
  event: PotholeEvent | null;
  onClose: () => void;
}

export const PotholeDetailModal: React.FC<PotholeDetailModalProps> = ({ event, onClose }) => {
  const { updateEventStatus } = useSystem();
  const [noteInput] = useState('');

  if (!event) return null;

  const handleStatusChange = (newStatus: PotholeStatus) => {
    updateEventStatus(event.id, newStatus, noteInput || event.notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl max-w-lg w-full p-5 shadow-2xl overflow-y-auto max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{event.id}</h3>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                  event.severity === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300'
                    : event.severity === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {event.severity} SEVERITY
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{event.roadSegmentName || 'Corridor'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Source Notice */}
        {event.source === 'HARDWARE' && (
          <div className="my-2 p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 flex items-center justify-between">
            <span className="font-mono">
              Source: <strong>Physical ESP32</strong> (Playback Frame {event.readingNumber !== undefined ? `#${event.readingNumber}` : ''})
            </span>
            <span className="text-[10px] text-cyan-400/80">Hardware-reported protocol</span>
          </div>
        )}

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Confidence</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">{event.confidence}%</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Est. Depth</div>
            <div className="text-base font-bold font-mono text-rose-400 mt-0.5">{event.estimatedDepth}</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Distance</div>
            <div className="text-base font-bold font-mono text-amber-400 mt-0.5">{event.ultrasonicDistance} cm</div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Accel Z</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
              {event.source === 'HARDWARE' ? 'N/A (Firmware)' : `${event.accelerationZ.toFixed(2)} m/s²`}
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Vibration</div>
            <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
              {event.vibrationG !== undefined ? `${event.vibrationG.toFixed(1)} g` : `${event.vibrationLevel}/100`}
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Speed</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
              {event.source === 'HARDWARE' ? 'N/A' : `${event.vehicleSpeed} km/h`}
            </div>
          </div>
        </div>

        {/* GPS Geotag */}
        <div className="space-y-1 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800 font-mono">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400">GPS:</span>
            <span>
              {event.source === 'HARDWARE' && (!event.latitude || event.latitude === 0)
                ? 'Unavailable (No GPS module in firmware)'
                : `${event.latitude.toFixed(5)}°, ${event.longitude.toFixed(5)}°`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Time:</span>
            <span>{new Date(event.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Reasons */}
        <div className="mt-3.5">
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Detection Sensor Fusion Breakdown:</span>
          <ul className="space-y-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            {event.reasons.map((r, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Status Actions */}
        <div className="mt-4 border-t border-slate-800 pt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">Update Status:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleStatusChange('NEW')}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                event.status === 'NEW'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              NEW
            </button>
            <button
              onClick={() => handleStatusChange('VERIFIED')}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                event.status === 'VERIFIED'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              VERIFIED
            </button>
            <button
              onClick={() => handleStatusChange('REPAIRED')}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                event.status === 'REPAIRED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              REPAIRED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
