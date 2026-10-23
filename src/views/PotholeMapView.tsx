import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Car,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { PotholeSeverity } from '../types';

// Helper component to auto-pan / follow the vehicle
const VehicleFollower: React.FC<{ center: [number, number] | null; follow: boolean }> = ({ center, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow && center) {
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
  const { currentReading, potholeEvents, operatingMode } = useSystem();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [followVehicle, setFollowVehicle] = useState<boolean>(false);

  const filteredEvents = potholeEvents.filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity === severityFilter;
  });

  const hasVehicleGps = Boolean(
    currentReading &&
    currentReading.gps &&
    currentReading.gps.isLocked &&
    typeof currentReading.gps.latitude === 'number' &&
    typeof currentReading.gps.longitude === 'number'
  );

  const vehiclePosition: [number, number] | null =
    hasVehicleGps && currentReading && currentReading.gps?.latitude != null && currentReading.gps?.longitude != null
      ? [currentReading.gps.latitude, currentReading.gps.longitude]
      : null;

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header & Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Road Health Geospatial Map
              {operatingMode === 'SIMULATION' && (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Demo Route
                </span>
              )}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {operatingMode === 'SIMULATION'
              ? `${filteredEvents.length} of ${potholeEvents.length} simulated detections mapped along Vijayawada test circuit.`
              : operatingMode === 'HARDWARE'
              ? 'Static Reference Map — Current firmware does not transmit GPS coordinates; vehicle tracking is inactive.'
              : potholeEvents.length === 0
              ? 'Static Reference Map — GPS tracking inactive in Standby mode.'
              : `${filteredEvents.length} of ${potholeEvents.length} detections mapped.`}
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap text-xs self-start md:self-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSeverityFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({potholeEvents.length})
            </button>
            <button
              onClick={() => setSeverityFilter('HIGH')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              High ({potholeEvents.filter((e) => e.severity === 'HIGH').length})
            </button>
            <button
              onClick={() => setSeverityFilter('MEDIUM')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Med ({potholeEvents.filter((e) => e.severity === 'MEDIUM').length})
            </button>
            <button
              onClick={() => setSeverityFilter('LOW')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                severityFilter === 'LOW'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Low ({potholeEvents.filter((e) => e.severity === 'LOW').length})
            </button>
          </div>

          <button
            disabled={!hasVehicleGps}
            onClick={() => setFollowVehicle((prev) => !prev)}
            title={!hasVehicleGps ? 'Tracking disabled: GPS unavailable' : followVehicle ? 'Tracking active' : 'Click to track'}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs ${
              !hasVehicleGps
                ? 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
                : followVehicle
                ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            {hasVehicleGps ? (followVehicle ? 'Following Unit' : 'Follow Unit') : 'GPS Inactive'}
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-sm h-[560px] relative">
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

          {/* Vehicle Marker only if genuine GPS fix is present */}
          {vehiclePosition && currentReading && currentReading.gps?.isLocked && (
            <Marker
              position={vehiclePosition}
              icon={createVehicleIcon(currentReading.gps.heading ?? 0)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" />
                    Patrol Vehicle
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">
                    Speed: {(currentReading.gps.speed ?? 0).toFixed(1)} km/h
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    {(currentReading.gps.latitude ?? 0).toFixed(4)}°, {(currentReading.gps.longitude ?? 0).toFixed(4)}°
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pothole Markers - only render if coordinates exist and are non-zero */}
          {filteredEvents.filter((evt) => evt.latitude && evt.longitude && (evt.latitude !== 0 || evt.longitude !== 0)).map((evt) => (
            <Marker
              key={evt.id}
              position={[evt.latitude, evt.longitude]}
              icon={createPotholeIcon(evt.severity, evt.status)}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-100">{evt.id}</span>
                    <div className="flex items-center gap-1">
                      {evt.isSimulated && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          DEMO
                        </span>
                      )}
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
                  </div>

                  <div className="space-y-0.5 text-slate-300 font-mono text-[11px] pt-1 border-t border-slate-700">
                    <div>Confidence: <span className="text-cyan-400 font-semibold">{evt.confidence}%</span></div>
                    <div>Est. Depth: <span className="text-slate-100">{evt.estimatedDepth}</span></div>
                    <div>Status: <span className="text-emerald-400 font-medium">{evt.status}</span></div>
                    {evt.isSimulated && (
                      <div className="text-[10px] text-emerald-400 pt-0.5 font-sans">
                        Simulated demo candidate
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-0.5">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* GPS Status Notice */}
        {!hasVehicleGps && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-4 py-2 rounded-xl text-xs text-slate-300 font-mono flex items-center gap-2 pointer-events-auto shadow-lg max-w-xl text-center">
            <Navigation className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {operatingMode === 'SIMULATION'
                ? 'Simulated GPS Route: Vehicle position advances along Vijayawada test circuit.'
                : operatingMode === 'HARDWARE'
                ? 'GPS unavailable — current firmware does not transmit GPS coordinates'
                : 'Standby — GPS tracking inactive. Reference map mode.'}
            </span>
          </div>
        )}

        {/* Minimal Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 p-3 rounded-xl shadow-lg text-[11px] space-y-1.5 pointer-events-auto">
          <div className="font-semibold text-slate-300 text-[10px] uppercase font-mono">Defect Severity</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Low Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Repaired</span>
          </div>
        </div>
      </div>
    </div>
  );
};
