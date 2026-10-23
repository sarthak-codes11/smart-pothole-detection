import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Info,
  X,
  Sparkles,
  Radio,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeEvent, PotholeSeverity, PotholeStatus } from '../types';
import { PotholeDetailModal } from '../components/PotholeDetailModal';

export const DetectionHistoryView: React.FC = () => {
  const {
    verifiedEvents,
    demoEvents,
    operatingMode,
    updateEventStatus,
    deleteEvent,
    clearDemoSession,
    clearVerifiedEvents,
    quarantineNotice,
    dismissQuarantineNotice,
  } = useSystem();

  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SIMULATION' | 'HARDWARE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | PotholeSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PotholeStatus>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'DEMO' | 'VERIFIED' | 'SINGLE';
    eventId?: string;
    title: string;
    description: string;
    actionLabel: string;
  } | null>(null);

  // Combine unique events according to source filter
  const poolEvents: PotholeEvent[] =
    sourceFilter === 'SIMULATION'
      ? demoEvents
      : sourceFilter === 'HARDWARE'
      ? verifiedEvents
      : [...demoEvents, ...verifiedEvents];

  const filteredEvents = poolEvents.filter((evt) => {
    const matchesSearch =
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.roadSegmentName && evt.roadSegmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.estimatedDepth.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) return;

    const headers = [
      'Event ID',
      'Data Source',
      'Reading Number',
      'Timestamp',
      'Latitude',
      'Longitude',
      'Severity',
      'Confidence (%)',
      'Estimated Depth',
      'Distance (cm)',
      'Accel Z (m/s2)',
      'Vibration',
      'Speed (km/h)',
      'Status',
      'Road Segment',
      'Notes',
    ];

    const rows = filteredEvents.map((e) => [
      e.id,
      e.isSimulated ? 'SIMULATED DEMO' : e.isPlayback ? 'ESP32 PLAYBACK' : 'HARDWARE REPORTED',
      e.readingNumber !== undefined ? e.readingNumber : 'N/A',
      e.timestamp,
      e.latitude,
      e.longitude,
      e.severity,
      e.confidence,
      e.estimatedDepth,
      e.ultrasonicDistance,
      e.accelerationZ,
      e.vibrationG !== undefined ? `${e.vibrationG} g` : e.vibrationLevel,
      e.vehicleSpeed,
      e.status,
      `"${e.roadSegmentName || 'Corridor'}"`,
      `"${e.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `road_defect_detections_${sourceFilter.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeConfirmedAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'DEMO') {
      clearDemoSession();
    } else if (confirmModal.type === 'VERIFIED') {
      clearVerifiedEvents();
    } else if (confirmModal.type === 'SINGLE' && confirmModal.eventId) {
      deleteEvent(confirmModal.eventId);
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
            className="p-1 text-amber-400 hover:text-amber-200 transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              Detection History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, filter, and inspect road defects reported by physical ESP32 telemetry (recorded playback) or simulation demo.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              disabled={filteredEvents.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export CSV ({filteredEvents.length})
            </button>

            {/* Clear Demo Session */}
            <button
              onClick={() =>
                setConfirmModal({
                  type: 'DEMO',
                  title: 'Clear Demo Session?',
                  description: `This will remove all ${demoEvents.length} simulated detections from the current demo session. Hardware records will remain unaffected.`,
                  actionLabel: 'Clear Demo Session',
                })
              }
              disabled={demoEvents.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-amber-300 border border-slate-700 hover:bg-amber-950/30 hover:border-amber-800/40 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              Clear Demo ({demoEvents.length})
            </button>

            {/* Purge Hardware Records */}
            <button
              onClick={() =>
                setConfirmModal({
                  type: 'VERIFIED',
                  title: 'Purge Hardware Defect Records?',
                  description: `This will permanently delete all ${verifiedEvents.length} physical hardware-reported defect records from local storage. This action cannot be undone.`,
                  actionLabel: 'Permanently Purge',
                })
              }
              disabled={verifiedEvents.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-rose-300 border border-slate-700 hover:bg-rose-950/30 hover:border-rose-800/40 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Purge Hardware ({verifiedEvents.length})
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {/* Provenance Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium w-fit">
            <button
              onClick={() => setSourceFilter('ALL')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                sourceFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Events ({demoEvents.length + verifiedEvents.length})
            </button>
            <button
              onClick={() => setSourceFilter('SIMULATION')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                sourceFilter === 'SIMULATION'
                  ? 'bg-emerald-500/15 text-emerald-300 shadow-sm border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Demo Session ({demoEvents.length})
            </button>
            <button
              onClick={() => setSourceFilter('HARDWARE')}
              className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                sourceFilter === 'HARDWARE'
                  ? 'bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Hardware-reported ({verifiedEvents.length})
            </button>
          </div>

          {/* Search & Select Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, depth, or road name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 shrink-0">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 shrink-0">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="REPAIRED">REPAIRED</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Detections Data Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Est. Depth</th>
                <th className="px-4 py-3">Location & Speed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <History className="w-8 h-8 text-slate-700 mb-2" />
                      <span className="text-sm font-medium text-slate-300">
                        {poolEvents.length === 0
                          ? sourceFilter === 'SIMULATION'
                            ? 'No simulated detections in current demo session'
                            : sourceFilter === 'HARDWARE'
                            ? 'No verified detections on record'
                            : 'No detection records available'
                          : 'No detections match the selected filters'}
                      </span>
                      <span className="text-xs text-slate-500 max-w-sm mt-1">
                        {sourceFilter === 'SIMULATION'
                          ? 'Launch the simulation demo or trigger scenarios to generate test events.'
                          : 'Events confirmed by genuine ESP32 hardware multi-sensor fusion will appear here.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const dateObj = new Date(evt.timestamp);
                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td
                        onClick={() => setSelectedEvent(evt)}
                        className="px-4 py-3 font-mono font-medium text-slate-200 group-hover:text-cyan-400"
                      >
                        {evt.id}
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3">
                        {evt.isSimulated ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            DEMO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            <Radio className="w-3 h-3 text-cyan-400" />
                            {evt.isPlayback ? 'HW PLAYBACK' : 'HARDWARE'}
                            {evt.readingNumber !== undefined && (
                              <span className="text-[9px] text-cyan-400/90 font-semibold">#{evt.readingNumber}</span>
                            )}
                          </span>
                        )}
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3 text-slate-300">
                        <div>{dateObj.toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dateObj.toLocaleTimeString()}</div>
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-1 ${
                            evt.severity === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                              : evt.severity === 'MEDIUM'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                          }`}
                        >
                          {evt.severity === 'HIGH' ? (
                            <AlertOctagon className="w-3 h-3 text-rose-400" />
                          ) : evt.severity === 'MEDIUM' ? (
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          {evt.severity}
                        </span>
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3 font-mono">
                        <span className="font-semibold text-cyan-400">{evt.confidence}%</span>
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3 font-mono text-slate-200">
                        <div>{evt.estimatedDepth}</div>
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3">
                        <div className="text-slate-200 truncate max-w-[140px]">
                          {evt.roadSegmentName || 'Corridor'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {evt.vehicleSpeed} km/h
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={evt.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateEventStatus(evt.id, e.target.value as PotholeStatus)}
                          className={`px-2 py-0.5 rounded text-xs font-medium border focus:outline-none ${
                            evt.status === 'REPAIRED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : evt.status === 'VERIFIED'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          <option value="NEW" className="bg-slate-900 text-rose-300">NEW</option>
                          <option value="VERIFIED" className="bg-slate-900 text-amber-300">VERIFIED</option>
                          <option value="REPAIRED" className="bg-slate-900 text-emerald-300">REPAIRED</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEvent(evt)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="View full diagnostic details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                type: 'SINGLE',
                                eventId: evt.id,
                                title: `Delete Record ${evt.id}?`,
                                description: `Are you sure you want to delete this ${evt.severity} severity detection recorded at ${new Date(evt.timestamp).toLocaleTimeString()}?`,
                                actionLabel: 'Delete Record',
                              })
                            }
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Event Detail Modal */}
      <PotholeDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'VERIFIED' || confirmModal.type === 'SINGLE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Confirm Data Action</p>
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
                  confirmModal.type === 'VERIFIED' || confirmModal.type === 'SINGLE'
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
