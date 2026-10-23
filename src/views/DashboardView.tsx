import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeEvent, PotholeSeverity } from '../types';
import { PotholeDetailModal } from '../components/PotholeDetailModal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { DETECTION_CONFIG } from '../config/detectionConfig';

// Auto-follow vehicle sub-component for dashboard map widget
const DashboardMapFollower: React.FC<{ center: [number, number]; follow: boolean }> = ({ center, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
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
    detectionResult,
    potholeEvents,
    roadHealth,
    setActiveTab,
  } = useSystem();

  const [selectedEvent, setSelectedEvent] = useState<PotholeEvent | null>(null);
  const [mapSeverityFilter, setMapSeverityFilter] = useState<'ALL' | PotholeSeverity>('ALL');
  const [autoFollow, setAutoFollow] = useState<boolean>(true);

  // Road Condition evaluation
  const getRoadCondition = () => {
    if (detectionResult.condition === 'POTHOLE DETECTED' || currentReading.vibration > 75 || currentReading.ultrasonicDistance > 38) {
      return {
        level: 'CRITICAL',
        color: 'border-rose-500/40 bg-rose-500/5 text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        icon: AlertOctagon,
        title: 'Road Anomaly Detected',
        desc: 'Vertical shock and depth anomaly detected on current road segment.',
      };
    }
    if (detectionResult.condition === 'POSSIBLE IRREGULARITY' || currentReading.vibration > 35 || currentReading.ultrasonicDistance > 25) {
      return {
        level: 'WARNING',
        color: 'border-amber-500/40 bg-amber-500/5 text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: AlertTriangle,
        title: 'Surface Irregularity Detected',
        desc: 'Elevated chassis vibration or minor surface elevation variance.',
      };
    }
    return {
      level: 'NORMAL',
      color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle2,
      title: 'Road Surface Normal',
      desc: 'Ground clearance within 18–25 cm. Nominal vibration and stable acceleration.',
    };
  };

  const condition = getRoadCondition();
  const ConditionIcon = condition.icon;

  const chartData = telemetryHistory.map((item) => ({
    time: item.timestamp.slice(14, 19),
    distance: item.ultrasonicDistance,
    vibration: item.vibration,
    accelZ: item.acceleration.z,
  }));

  // Filtered pothole markers for the embedded map widget
  const mapFilteredEvents = potholeEvents.filter((e) => {
    if (mapSeverityFilter === 'ALL') return true;
    return e.severity === mapSeverityFilter;
  });

  // Closed circuit route line
  const routePositions: [number, number][] = [
    ...DETECTION_CONFIG.routeWaypoints.map((wp): [number, number] => [wp.lat, wp.lng]),
    [DETECTION_CONFIG.routeWaypoints[0].lat, DETECTION_CONFIG.routeWaypoints[0].lng],
  ];

  const vehiclePosition: [number, number] = [
    currentReading.gps.latitude,
    currentReading.gps.longitude,
  ];

  return (
    <div className="space-y-4 pb-10">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Potholes */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Potholes</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{roadHealth.totalPotholes}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{roadHealth.activePotholesCount} active, {roadHealth.repairedCount} repaired</div>
        </div>

        {/* High Severity */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400">High Severity</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{roadHealth.highSeverityCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Critical defects</div>
        </div>

        {/* Medium Severity */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400">Medium Severity</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{roadHealth.mediumSeverityCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Moderate damage</div>
        </div>

        {/* Low Severity */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400">Low Severity</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{roadHealth.lowSeverityCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Minor defects</div>
        </div>

        {/* Road Health Score */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-cyan-400">Road Health</span>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1 flex items-baseline gap-1">
            <span>{roadHealth.score}</span>
            <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <div className="text-[10px] text-cyan-300 mt-0.5 font-medium">{roadHealth.rating} condition</div>
        </div>

        {/* Events Today */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Events Today</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{roadHealth.eventsTodayCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Current patrol run</div>
        </div>
      </div>

      {/* Road Condition Panel */}
      <div className={`p-3.5 rounded-xl border transition-colors ${condition.color}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-950/40 border border-current shrink-0">
              <ConditionIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-100">{condition.title}</span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold tracking-wider border ${condition.badge}`}>
                  {condition.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{condition.desc}</p>
            </div>
          </div>

          {/* Key Readings */}
          <div className="flex items-center gap-3 bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-400 text-[10px] block">Distance</span>
              <span className="text-slate-100 font-bold">{currentReading.ultrasonicDistance} cm</span>
            </div>
            <div className="h-5 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 text-[10px] block">Accel Z</span>
              <span className="text-slate-100 font-bold">{currentReading.acceleration.z.toFixed(2)} m/s²</span>
            </div>
            <div className="h-5 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 text-[10px] block">Vibration</span>
              <span className="text-slate-100 font-bold">{currentReading.vibration}/100</span>
            </div>
            <div className="h-5 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-400 text-[10px] block">Speed</span>
              <span className="text-cyan-400 font-bold">{currentReading.gps.speed} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Left Side (Waveform & Recent Detections) + Right Side (Live Map Sidescreen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column (7 cols on desktop): Live Waveform & Recent Detections */}
        <div className="lg:col-span-7 space-y-4">
          {/* Realtime Waveform Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200">Live Telemetry Waveform</h3>
              </div>
              <button
                onClick={() => setActiveTab('live')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                Telemetry Dials
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="vibGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 65]} />
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
                    dataKey="distance"
                    name="Distance (cm)"
                    stroke="#38bdf8"
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
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  Ultrasonic Distance (cm)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Vibration (0–100)
                </span>
              </div>
              <span className="font-mono text-slate-400 text-[10px]">Sampling: 350ms</span>
            </div>
          </div>

          {/* Recent Detections List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-200">Recent Detections</h3>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                View History ({potholeEvents.length})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
              {potholeEvents.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="p-2.5 bg-slate-950/50 hover:bg-slate-800/60 border border-slate-800/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                          evt.severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : evt.severity === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {evt.severity}
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] truncate">{evt.id}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {evt.roadSegmentName || 'Corridor Link'}
                    </p>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <div className="text-cyan-400 font-semibold text-xs">{evt.confidence}%</div>
                    <div className="text-[10px] text-slate-400">{evt.estimatedDepth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols on desktop): Live Pothole Map Sidescreen */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
          {/* Map Header with Filters */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200">Live GPS Patrol Map</h3>
            </div>

            {/* Severity Filter Mini Pills */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setMapSeverityFilter('ALL')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mapSeverityFilter === 'ALL'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMapSeverityFilter('HIGH')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mapSeverityFilter === 'HIGH'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                High
              </button>
              <button
                onClick={() => setMapSeverityFilter('MEDIUM')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mapSeverityFilter === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Med
              </button>
              <button
                onClick={() => setMapSeverityFilter('LOW')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mapSeverityFilter === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Low
              </button>
            </div>
          </div>

          {/* Embedded Leaflet Map Widget */}
          <div className="h-[360px] w-full rounded-lg overflow-hidden border border-slate-800/80 my-2 relative">
            <MapContainer
              center={[16.514, 80.646]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <DashboardMapFollower center={vehiclePosition} follow={autoFollow} />

              {/* Road Route Polyline */}
              <Polyline
                positions={routePositions}
                color="#0284c7"
                weight={3.5}
                opacity={0.8}
                dashArray="5, 5"
              />

              {/* Live Vehicle Marker */}
              <Marker
                position={vehiclePosition}
                icon={createVehicleIcon(currentReading.gps.heading)}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="font-semibold text-cyan-400 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Patrol Vehicle
                    </div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      Speed: {currentReading.gps.speed} km/h
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Pothole Markers */}
              {mapFilteredEvents.map((evt) => (
                <Marker
                  key={evt.id}
                  position={[evt.latitude, evt.longitude]}
                  icon={createPotholeIcon(evt.severity, evt.status)}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs min-w-[160px]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-100">{evt.id}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            evt.severity === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300'
                              : evt.severity === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {evt.severity}
                        </span>
                      </div>
                      <div className="text-slate-300 font-mono text-[10px] pt-0.5 border-t border-slate-700">
                        <div>Conf: <span className="text-cyan-400 font-semibold">{evt.confidence}%</span> | Depth: {evt.estimatedDepth}</div>
                        <div className="text-slate-400 mt-0.5">{evt.roadSegmentName}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map Mini Controls Overlay */}
            <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
              <button
                onClick={() => setAutoFollow((prev) => !prev)}
                title={autoFollow ? 'Auto-tracking Vehicle: ON' : 'Auto-tracking Vehicle: OFF'}
                className={`p-1.5 rounded-md shadow-md text-[10px] border font-medium flex items-center gap-1 transition-colors ${
                  autoFollow
                    ? 'bg-cyan-600 text-white border-cyan-500'
                    : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span>{autoFollow ? 'Tracking' : 'Free Map'}</span>
              </button>
            </div>
          </div>

          {/* Map Footer Link */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="truncate">Circuit: MG Rd ➔ Benz Circle ➔ Karl Marx Rd</span>
            <button
              onClick={() => setActiveTab('map')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors shrink-0 ml-2"
            >
              Full GIS Map
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Event Modal */}
      <PotholeDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
};
