import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Shield,
  Layers,
  MapPin,
  Activity,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
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
  const { potholeEvents, roadHealth } = useSystem();

  const severityData = [
    { name: 'High', count: roadHealth.highSeverityCount, color: '#ef4444' },
    { name: 'Medium', count: roadHealth.mediumSeverityCount, color: '#f59e0b' },
    { name: 'Low', count: roadHealth.lowSeverityCount, color: '#10b981' },
  ];

  const totalConfidence = potholeEvents.reduce((acc, curr) => acc + curr.confidence, 0);
  const avgConfidence = potholeEvents.length > 0 ? Math.round(totalConfidence / potholeEvents.length) : 0;

  const segmentMap: Record<string, { high: number; med: number; low: number; total: number }> = {};
  potholeEvents.forEach((e) => {
    const seg = e.roadSegmentName || 'Main Corridor';
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

  const timelineData = [
    { hour: '08:00', healthScore: 98 },
    { hour: '10:00', healthScore: 94 },
    { hour: '12:00', healthScore: 92 },
    { hour: '14:00', healthScore: 84 },
    { hour: '16:00', healthScore: 78 },
    { hour: '18:00', healthScore: roadHealth.score },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total Detections</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1.5">{potholeEvents.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{roadHealth.activePotholesCount} active hazards</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Avg Confidence</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">{avgConfidence}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fusion agreement score</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Road Health</span>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1.5">{roadHealth.score}/100</div>
          <div className="text-[10px] text-cyan-300 mt-0.5 font-medium">{roadHealth.rating} Rating</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Highest Risk Area</span>
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 mt-1.5 truncate">
            {roadHealth.mostAffectedSegment}
          </div>
          <div className="text-[10px] text-rose-400 mt-0.5">Priority maintenance</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Severity Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <PieIcon className="w-3.5 h-3.5 text-cyan-400" />
              Severity Breakdown
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Total: {potholeEvents.length}</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
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
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Potholes by Sector */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Detections by Sector
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Hazard Density</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.375rem',
                    fontSize: '11px',
                  }}
                />
                <Legend />
                <Bar dataKey="High" fill="#ef4444" stackId="a" />
                <Bar dataKey="Medium" fill="#f59e0b" stackId="a" />
                <Bar dataKey="Low" fill="#10b981" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Road Health Degradation Trend */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200">Road Health Score Degradation Timeline</h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-300">Target: &gt;90 (GOOD)</span>
        </div>

        <div className="h-44 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="healthGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={[60, 100]} />
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
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#healthGrad2)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
