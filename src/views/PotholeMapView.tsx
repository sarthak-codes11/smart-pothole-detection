import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Car,
  Navigation,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeSeverity } from '../types';
import { DETECTION_CONFIG } from '../config/detectionConfig';

// Helper component to auto-pan / follow the simulated vehicle
const VehicleFollower: React.FC<{ center: [number, number]; follow: boolean }> = ({ center, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.panTo(center, { animate: true, duration: 0.4 });
    }
  }, [center, follow, map]);
  return null;
};

// Create custom SVG Leaflet DivIcons
const createVehicleIcon = (heading: number) => {
  return L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #0284c7; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

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
      <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 18px; height: 18px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

export const PotholeMapView: React.FC = () => {
  const { currentReading, potholeEvents } = useSystem();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [followVehicle, setFollowVehicle] = useState<boolean>(false);

  const filteredEvents = potholeEvents.filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity === severityFilter;
  });

  // Extract route coordinates and close loop
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
      {/* Map Filter & Metrics Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-semibold text-slate-100">
              Road Health Geospatial Map
            </h2>
            <p className="text-[11px] text-slate-400">
              {filteredEvents.length} of {potholeEvents.length} detections on active street circuit (MG Road ➔ Benz Circle ➔ Ring Road ➔ Karl Marx Road)
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                severityFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({potholeEvents.length})
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                severityFilter === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High ({potholeEvents.filter((e) => e.severity === 'HIGH').length})
            </button>
            <button
              onClick={() => setSeverityFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                severityFilter === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medium ({potholeEvents.filter((e) => e.severity === 'MEDIUM').length})
            </button>
            <button
              onClick={() => setSeverityFilter('LOW')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                severityFilter === 'LOW'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Low ({potholeEvents.filter((e) => e.severity === 'LOW').length})
            </button>
          </div>

          <button
            onClick={() => setFollowVehicle((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
              followVehicle
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3 h-3" />
            {followVehicle ? 'Tracking Vehicle' : 'Track Vehicle'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl h-[560px] relative">
        <MapContainer
          center={[16.514, 80.646]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <VehicleFollower center={vehiclePosition} follow={followVehicle} />

          {/* Road Route Polyline */}
          <Polyline
            positions={routePositions}
            color="#0284c7"
            weight={4}
            opacity={0.8}
            dashArray="6, 6"
          />

          {/* Vehicle Marker */}
          <Marker
            position={vehiclePosition}
            icon={createVehicleIcon(currentReading.gps.heading)}
          >
            <Popup>
              <div className="p-1 space-y-1 text-xs">
                <div className="font-semibold text-cyan-400 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  Simulated Patrol Vehicle
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  Speed: {currentReading.gps.speed} km/h
                </div>
                <div className="text-slate-400 font-mono text-[10px]">
                  {currentReading.gps.latitude.toFixed(4)}°, {currentReading.gps.longitude.toFixed(4)}°
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Pothole Markers */}
          {filteredEvents.map((evt) => (
            <Marker
              key={evt.id}
              position={[evt.latitude, evt.longitude]}
              icon={createPotholeIcon(evt.severity, evt.status)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[180px]">
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

                  <div className="space-y-0.5 text-slate-300 font-mono text-[11px] pt-1 border-t border-slate-700">
                    <div>Confidence: <span className="text-cyan-400 font-semibold">{evt.confidence}%</span></div>
                    <div>Est. Depth: <span className="text-slate-100">{evt.estimatedDepth}</span></div>
                    <div>Status: <span className="text-emerald-400 font-medium">{evt.status}</span></div>
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Minimal Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-slate-800 p-2.5 rounded-lg shadow-lg text-[11px] space-y-1.5 pointer-events-auto">
          <div className="font-semibold text-slate-300 text-[10px] uppercase">Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-300">Low Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Repaired</span>
          </div>
        </div>
      </div>
    </div>
  );
};
