import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Shield,
  Layers,
  MapPin,
  Activity,
  Sparkles,
  Radio,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { RoadHealthEngine } from '../services/RoadHealthEngine';
import { PotholeEvent } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

export const AnalyticsView: React.FC = () => {
  const { potholeEvents, verifiedEvents, demoEvents, operatingMode } = useSystem();
  const [sourceFilter, setSourceFilter] = useState<'AUTO' | 'SIMULATION' | 'HARDWARE'>('AUTO');

  // Select events according to source filter
  const selectedEvents: PotholeEvent[] =
    sourceFilter === 'SIMULATION'
      ? demoEvents
      : sourceFilter === 'HARDWARE'
      ? verifiedEvents
      : potholeEvents;

  const currentSourceLabel =
    sourceFilter === 'SIMULATION' || (sourceFilter === 'AUTO' && operatingMode === 'SIMULATION')
      ? 'Demo Session (Simulated Telemetry)'
      : 'ESP32 Hardware-reported Playback';

  const isSimulatedSource =
    sourceFilter === 'SIMULATION' || (sourceFilter === 'AUTO' && operatingMode === 'SIMULATION');

  const metrics = RoadHealthEngine.calculateMetrics(selectedEvents);
  const hasEvents = selectedEvents.length > 0;

  const severityData = [
    { name: 'High', count: metrics.highSeverityCount, color: '#ef4444' },
    { name: 'Medium', count: metrics.mediumSeverityCount, color: '#f59e0b' },
    { name: 'Low', count: metrics.lowSeverityCount, color: '#10b981' },
  ].filter((item) => item.count > 0);

  const totalConfidence = selectedEvents.reduce((acc, curr) => acc + curr.confidence, 0);
  const avgConfidence = hasEvents ? Math.round(totalConfidence / selectedEvents.length) : null;

  const segmentMap: Record<string, { high: number; med: number; low: number; total: number }> = {};
  selectedEvents.forEach((e) => {
    const seg = e.roadSegmentName || 'Corridor (Playback)';
    if (!segmentMap[seg]) {
      segmentMap[seg] = { high: 0, med: 0, low: 0, total: 0 };
    }
    if (e.severity === 'HIGH') segmentMap[seg].high++;
    else if (e.severity === 'MEDIUM') segmentMap[seg].med++;
    else segmentMap[seg].low++;
    segmentMap[seg].total++;
  });

  const segmentChartData = Object.entries(segmentMap).map(([name, data]) => ({
    name: name.replace(' Sector 1', '').replace(' Junction', '').replace(' Avenue', ''),
    fullName: name,
    High: data.high,
    Medium: data.med,
    Low: data.low,
  }));

  // Build genuine degradation trend from actual events in the active pool
  const timelineData = hasEvents
    ? selectedEvents
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((evt, idx, arr) => {
          const sliceEvents = arr.slice(0, idx + 1);
          const pen = sliceEvents.reduce((sum, e) => {
            return sum + (e.severity === 'HIGH' ? 16 : e.severity === 'MEDIUM' ? 9 : 4);
          }, 0);
          return {
            time: new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            healthScore: Math.max(12, 100 - pen),
          };
        })
    : [];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Analytics Source & Provenance Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Road Health Analytics & Defect Distribution
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated severity distributions, road health degradation, and corridor segment metrics.
          </p>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium self-start md:self-auto">
          <button
            onClick={() => setSourceFilter('AUTO')}
            className={`px-3 py-1 rounded-md transition-colors ${
              sourceFilter === 'AUTO'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Mode ({selectedEvents.length})
          </button>
          <button
            onClick={() => setSourceFilter('SIMULATION')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              sourceFilter === 'SIMULATION'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Demo ({demoEvents.length})
          </button>
          <button
            onClick={() => setSourceFilter('HARDWARE')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              sourceFilter === 'HARDWARE'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Hardware ({verifiedEvents.length})
          </button>
        </div>
      </div>

      {/* Dataset Provenance Pill */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Current Dataset:</span>
          <span
            className={`font-mono font-medium px-2 py-0.5 rounded text-[11px] border ${
              isSimulatedSource
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
            }`}
          >
            {currentSourceLabel}
          </span>
        </div>
        <span className="text-slate-500 text-[11px] font-mono">
          Computed from active telemetry history & events • Zero fabrication
        </span>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Detections</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-2">{selectedEvents.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {hasEvents ? `${metrics.activePotholesCount} active, ${metrics.repairedCount} repaired` : 'No defects recorded'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Confidence</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {avgConfidence !== null ? `${avgConfidence}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {hasEvents ? 'Multi-sensor fusion agreement' : 'Awaiting detections'}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Road Health Score</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {metrics.score !== null ? `${metrics.score}/100` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {metrics.rating === 'UNAVAILABLE' ? 'Awaiting telemetry' : `${metrics.rating} Condition`}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Highest Risk Area</span>
            <MapPin className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-2 truncate">
            {hasEvents ? metrics.mostAffectedSegment : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {hasEvents ? 'Priority corridor maintenance' : 'No observations on record'}
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Severity Distribution */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              Defect Severity Breakdown
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              {hasEvents ? `${selectedEvents.length} Observations` : 'Awaiting Data'}
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center pt-2">
            {hasEvents && severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-slate-300 text-xs">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center p-4">
                <PieIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-400">No Severity Distribution Data</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Severity breakdown will chart here when defect events are registered in this pool.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Degradation Trend */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Road Health Timeline
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Chronological</span>
          </div>

          <div className="h-64 w-full pt-2">
            {hasEvents && timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="healthTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="healthScore"
                    name="Health Score"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#healthTimelineGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <TrendingUp className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-400">No Degradation Observations</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Timeline tracks running road health degradation as events are discovered over time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Corridor Defects By Road Segment */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Corridor Defect Distribution by Named Road Segment
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Corridor Breakdown</span>
          </div>

          <div className="h-64 w-full pt-3">
            {hasEvents && segmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.375rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    formatter={(val) => <span className="text-slate-300 text-xs">{val} Severity</span>}
                  />
                  <Bar dataKey="High" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Medium" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Low" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <BarChart3 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-400">No Segment Data Recorded</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Segment defect distribution will compute when road inspections record anomalies.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
