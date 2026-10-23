export type PotholeSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type PotholeStatus = 'NEW' | 'VERIFIED' | 'REPAIRED';

export type RoadCondition = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type DetectionCondition = 'NORMAL' | 'POSSIBLE IRREGULARITY' | 'POTHOLE DETECTED';

export type HardwareConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'AWAITING_TELEMETRY'
  | 'CONNECTED'
  | 'CONNECTION_LOST'
  | 'ERROR';

export type HardwareConnectionType = 'WEBSOCKET' | 'SERIAL';

export type TelemetrySource = 'HARDWARE' | 'SIMULATION';

export type OperatingMode = 'STANDBY' | 'HARDWARE' | 'SIMULATION';

export type AnalysisState = 'IDLE' | 'RUNNING' | 'PAUSED';

export interface SensorReading {
  timestamp: string;
  source: TelemetrySource;
  isSimulated?: boolean;
  isPlayback?: boolean;
  sequenceNumber?: number;
  readingNumber?: number;
  ultrasonicDistance: number; // in cm
  vibrationG?: number; // vibration in g reported by firmware
  vibration: number; // reported vibration value
  statusText?: 'NORMAL' | 'POTHOLE DETECTED';
  isPotholeDetected?: boolean;
  acceleration: {
    x: number | null; // m/s^2 or null if unavailable
    y: number | null;
    z: number | null;
    isAvailable?: boolean;
  };
  gyroscope: {
    x: number | null;
    y: number | null;
    z: number | null;
    isAvailable?: boolean;
  };
  gps: {
    latitude: number | null;
    longitude: number | null;
    speed: number | null;
    heading: number | null;
    isLocked: boolean;
    satellites?: number | null;
    isSimulated?: boolean;
    isAvailable?: boolean;
  };
}

export interface PotholeEvent {
  id: string;
  timestamp: string;
  source: TelemetrySource;
  isSimulated?: boolean;
  isPlayback?: boolean;
  readingNumber?: number;
  latitude: number;
  longitude: number;
  severity: PotholeSeverity;
  confidence: number; // 0 - 100%
  estimatedDepth: string; // e.g. "3.5 cm", "8.2 cm", "14.5 cm"
  impactLevel: 'Minor' | 'Moderate' | 'Severe';
  ultrasonicDistance: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  vibrationLevel: number;
  vibrationG?: number;
  vehicleSpeed: number;
  status: PotholeStatus;
  reasons: string[];
  roadSegmentName?: string;
  repairedAt?: string;
  notes?: string;
}

export interface DetectionResult {
  condition: DetectionCondition | 'STANDBY';
  confidence: number | null; // 0 - 100% or null when awaiting telemetry
  severity: PotholeSeverity | null;
  reasons: string[];
  distanceAnomalyContribution: number | null; // 0 - 40 or null
  accelAnomalyContribution: number | null; // 0 - 40 or null
  vibrationContribution: number | null; // 0 - 20 or null
  isPotholeConfirmed: boolean;
}

export interface RoadHealthMetrics {
  score: number | null; // 0 - 100 or null when unavailable
  rating: 'GOOD' | 'MODERATE' | 'POOR' | 'UNAVAILABLE';
  totalPotholes: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  eventsTodayCount: number;
  mostAffectedSegment: string;
  activePotholesCount: number;
  repairedCount: number;
  isAvailable?: boolean;
}

export interface SubsystemStatus {
  esp32: {
    hardwareStatus: 'NOT CONNECTED' | 'CONNECTED';
    mode: 'STANDBY' | 'HARDWARE' | 'AWAITING INTEGRATION';
    name: string;
    details: string;
  };
  ultrasonic: {
    name: string;
    status: 'NO DATA' | 'AWAITING TELEMETRY' | 'ACTIVE';
    currentRange: string;
    healthy: boolean;
  };
  mpu9250: {
    name: string;
    status: 'NO DATA' | 'AWAITING TELEMETRY' | 'ACTIVE';
    sampleRate: string;
    healthy: boolean;
  };
  gps: {
    name: string;
    status: 'NO FIX' | 'AWAITING TELEMETRY' | 'LOCKED';
    satellites: number | null;
    healthy: boolean;
  };
  vibration: {
    name: string;
    status: 'NO DATA' | 'AWAITING TELEMETRY' | 'ACTIVE';
    healthy: boolean;
  };
  buzzer: {
    name: string;
    status: 'INTEGRATION PENDING';
    details: string;
  };
  storage: {
    name: string;
    status: 'LOCAL STORAGE';
    recordCount: number;
  };
  detectionEngine: {
    name: string;
    status: 'INITIALIZED (STANDBY)' | 'PROCESSING';
    algorithm: string;
  };
}

export interface SimulationSequenceState {
  sequenceName: string | null;
  phase: number;
  phaseTitle: string;
  phaseDescription: string;
  totalPhases: number;
  isActive: boolean;
}
