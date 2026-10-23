export type PotholeSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type PotholeStatus = 'NEW' | 'VERIFIED' | 'REPAIRED';

export type RoadCondition = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type DetectionCondition = 'NORMAL' | 'POSSIBLE IRREGULARITY' | 'POTHOLE DETECTED';

export interface SensorReading {
  timestamp: string;
  ultrasonicDistance: number; // in cm
  acceleration: {
    x: number; // m/s^2
    y: number; // m/s^2
    z: number; // m/s^2 (nominal ~9.8)
  };
  gyroscope: {
    x: number; // deg/s
    y: number; // deg/s
    z: number; // deg/s
  };
  vibration: number; // 0 - 100 scale
  gps: {
    latitude: number;
    longitude: number;
    speed: number; // km/h
    heading: number; // degrees 0-360
    isLocked: boolean;
  };
}

export interface PotholeEvent {
  id: string;
  timestamp: string;
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
  vehicleSpeed: number;
  status: PotholeStatus;
  reasons: string[];
  roadSegmentName?: string;
  repairedAt?: string;
  notes?: string;
}

export interface DetectionResult {
  condition: DetectionCondition;
  confidence: number; // 0 - 100%
  severity: PotholeSeverity | null;
  reasons: string[];
  distanceAnomalyContribution: number; // 0 - 40
  accelAnomalyContribution: number; // 0 - 40
  vibrationContribution: number; // 0 - 20
  isPotholeConfirmed: boolean;
}

export interface RoadHealthMetrics {
  score: number; // 0 - 100
  rating: 'GOOD' | 'MODERATE' | 'POOR';
  totalPotholes: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  eventsTodayCount: number;
  mostAffectedSegment: string;
  activePotholesCount: number;
  repairedCount: number;
}

export interface SubsystemStatus {
  esp32: {
    hardwareStatus: 'NOT CONNECTED';
    mode: 'SIMULATION';
    name: 'ESP-32 Dual Core MCU';
  };
  ultrasonic: {
    name: 'HC-SR04 Ultrasonic Distance Sensor';
    status: 'SIMULATED';
    currentRange: string;
    healthy: boolean;
  };
  mpu9250: {
    name: 'MPU-9250 9-DoF IMU (Accel + Gyro)';
    status: 'SIMULATED';
    sampleRate: '50 Hz';
    healthy: boolean;
  };
  gps: {
    name: 'NEO-6M GPS Receiver Module';
    status: 'SIMULATED';
    satellites: number;
    healthy: boolean;
  };
  vibration: {
    name: 'SW-420 Piezo Vibration Sensor';
    status: 'SIMULATED';
    healthy: boolean;
  };
  cloudDatabase: {
    name: 'Telemetry & Event Storage';
    status: 'LOCAL STORAGE';
    recordCount: number;
  };
  detectionEngine: {
    name: 'Rule-Based Multi-Sensor Fusion Engine';
    status: 'ACTIVE';
    algorithm: 'Weighted Anomaly Confidence Matrix';
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
