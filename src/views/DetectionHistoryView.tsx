import React, { useState } from 'react';
import {
  History,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Eye,
  Trash2,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeEvent, PotholeSeverity, PotholeStatus } from '../types';
import { PotholeDetailModal } from '../components/PotholeDetailModal';

export const DetectionHistoryView: React.FC = () => {
  const {
    potholeEvents,
    updateEventStatus,
    deleteEvent,
    resetToSeedEvents,
  } = useSystem();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | PotholeSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PotholeStatus>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);

  const filteredEvents = potholeEvents.filter((evt) => {
    const matchesSearch =
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.roadSegmentName && evt.roadSegmentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      evt.estimatedDepth.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = [
      'Event ID',
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
    ];

    const rows = filteredEvents.map((e) => [
      e.id,
      e.timestamp,
      e.latitude,
      e.longitude,
      e.severity,
      e.confidence,
      e.estimatedDepth,
      e.ultrasonicDistance,
      e.accelerationZ,
      e.vibrationLevel,
      e.vehicleSpeed,
      e.status,
      `"${e.roadSegmentName || 'Corridor'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pothole_detections_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-10">
      {/* Header & Controls Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-xs font-semibold text-slate-100">Detection History & Maintenance Log</h2>
              <p className="text-[11px] text-slate-400">
                Persisted in LocalStorage. Track repairs and update status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV ({filteredEvents.length})
            </button>

            <button
              onClick={resetToSeedEvents}
              className="px-2.5 py-1.5 rounded-lg font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Seed
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or road name..."
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
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
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

      {/* Detections Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Depth</th>
                <th className="px-4 py-3">Location & Speed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No detections match the selected filters.
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
                        className="px-4 py-3 font-mono font-semibold text-slate-200 group-hover:text-cyan-400"
                      >
                        {evt.id}
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3 text-slate-300">
                        <div>{dateObj.toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dateObj.toLocaleTimeString()}</div>
                      </td>

                      <td onClick={() => setSelectedEvent(evt)} className="px-4 py-3">
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                            evt.severity === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300'
                              : evt.severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {evt.severity === 'HIGH' ? (
                            <AlertOctagon className="w-3 h-3" />
                          ) : evt.severity === 'MEDIUM' ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
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
                          className={`px-2 py-0.5 rounded text-xs font-bold border focus:outline-none ${
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
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedEvent(evt)}
                            title="Inspect"
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(evt.id);
                            }}
                            title="Delete"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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

      <PotholeDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};
