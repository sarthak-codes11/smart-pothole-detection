import { ISensorService, SensorDataListener, SequenceStateListener } from './SensorService';
import { SensorReading, SimulationSequenceState } from '../types';
import { DETECTION_CONFIG } from '../config/detectionConfig';

export class SimulatedSensorService implements ISensorService {
  private listeners: Set<SensorDataListener> = new Set();
  private sequenceListeners: Set<SequenceStateListener> = new Set();
  private timerId: number | null = null;
  private running: boolean = false;

  // Route & Motion State
  private currentWaypointIndex: number = 0;
  private routeProgress: number = 0; // 0 to 1 between current and next waypoint
  private currentLat: number = DETECTION_CONFIG.routeWaypoints[0].lat;
  private currentLng: number = DETECTION_CONFIG.routeWaypoints[0].lng;
  private currentSpeed: number = DETECTION_CONFIG.baselines.vehicleSpeedNominal;
  private currentHeading: number = 42.0;

  // Active Sequence State
  private activeSequenceTimeout: number | null = null;
  private currentSequenceState: SimulationSequenceState = {
    sequenceName: null,
    phase: 0,
    phaseTitle: 'Idle Normal Stream',
    phaseDescription: 'Vehicle cruising smoothly on inspected route.',
    totalPhases: 8,
    isActive: false,
  };

  // Sensor Modifier Offsets (applied to physical baseline)
  private distanceOffset: number = 0;
  private accelZOffset: number = 0;
  private accelXOffset: number = 0;
  private accelYOffset: number = 0;
  private gyroXOffset: number = 0;
  private gyroYOffset: number = 0;
  private gyroZOffset: number = 0;
  private vibrationOffset: number = 0;

  private latestReading: SensorReading;

  constructor() {
    this.latestReading = this.generateReading();
  }

  public subscribe(listener: SensorDataListener): () => void {
    this.listeners.add(listener);
    // Send immediate snapshot upon subscription
    listener(this.latestReading);
    return () => this.listeners.delete(listener);
  }

  public subscribeSequence(listener: SequenceStateListener): () => void {
    this.sequenceListeners.add(listener);
    listener(this.currentSequenceState);
    return () => this.sequenceListeners.delete(listener);
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.tick();
  }

  public pause(): void {
    this.running = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public reset(): void {
    this.pause();
    if (this.activeSequenceTimeout !== null) {
      clearTimeout(this.activeSequenceTimeout);
      this.activeSequenceTimeout = null;
    }
    this.currentWaypointIndex = 0;
    this.routeProgress = 0;
    this.currentLat = DETECTION_CONFIG.routeWaypoints[0].lat;
    this.currentLng = DETECTION_CONFIG.routeWaypoints[0].lng;
    this.currentSpeed = DETECTION_CONFIG.baselines.vehicleSpeedNominal;
    this.currentHeading = 42.0;
    this.resetOffsets();

    this.updateSequenceState({
      sequenceName: null,
      phase: 0,
      phaseTitle: 'Reset to Starting Location',
      phaseDescription: 'System initialized at route origin.',
      totalPhases: 8,
      isActive: false,
    });

    this.latestReading = this.generateReading();
    this.notifyListeners();
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getSourceName(): 'SIMULATED' | 'ESP32_HARDWARE' {
    return 'SIMULATED';
  }

  public getCurrentReading(): SensorReading {
    return this.latestReading;
  }

  private resetOffsets(): void {
    this.distanceOffset = 0;
    this.accelZOffset = 0;
    this.accelXOffset = 0;
    this.accelYOffset = 0;
    this.gyroXOffset = 0;
    this.gyroYOffset = 0;
    this.gyroZOffset = 0;
    this.vibrationOffset = 0;
  }

  private tick = (): void => {
    if (!this.running) return;

    // Advance GPS along the realistic waypoints route
    this.advanceVehiclePosition();

    // Generate new sensor reading
    this.latestReading = this.generateReading();
    this.notifyListeners();

    // Schedule next tick (between 350ms and 450ms for realistic hardware telemetry)
    const interval = 350 + Math.floor(Math.random() * 100);
    this.timerId = window.setTimeout(this.tick, interval);
  };

  private advanceVehiclePosition(): void {
    const waypoints = DETECTION_CONFIG.routeWaypoints;
    const currentWp = waypoints[this.currentWaypointIndex];
    const nextWp = waypoints[(this.currentWaypointIndex + 1) % waypoints.length];

    // Speed-dependent progression rate
    const step = 0.02 + (Math.random() * 0.005);
    this.routeProgress += step;

    if (this.routeProgress >= 1) {
      this.routeProgress = 0;
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % waypoints.length;
    }

    // Linear interpolation between waypoints
    const wpA = waypoints[this.currentWaypointIndex];
    const wpB = waypoints[(this.currentWaypointIndex + 1) % waypoints.length];

    this.currentLat = wpA.lat + (wpB.lat - wpA.lat) * this.routeProgress;
    this.currentLng = wpA.lng + (wpB.lng - wpA.lng) * this.routeProgress;

    // Calculate heading angle
    const dLng = wpB.lng - wpA.lng;
    const dLat = wpB.lat - wpA.lat;
    this.currentHeading = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    if (this.currentHeading < 0) this.currentHeading += 360;

    // Slight speed jitter
    this.currentSpeed = Math.max(20, Math.min(55, this.currentSpeed + (Math.random() * 1.5 - 0.75)));
  }

  private generateReading(): SensorReading {
    // Add micro physical noise (sensor jitter)
    const distJitter = (Math.random() * 0.8 - 0.4);
    const accelZJitter = (Math.random() * 0.3 - 0.15);
    const accelXJitter = (Math.random() * 0.2 - 0.1);
    const accelYJitter = (Math.random() * 0.2 - 0.1);
    const gyroJitter = (Math.random() * 0.4 - 0.2);
    const vibJitter = (Math.random() * 3 - 1.5);

    const base = DETECTION_CONFIG.baselines;

    const ultrasonicDistance = Number(
      Math.max(12, base.ultrasonicDistanceCm + this.distanceOffset + distJitter).toFixed(1)
    );

    const accelZ = Number((base.accelZNominal + this.accelZOffset + accelZJitter).toFixed(2));
    const accelX = Number((base.accelXNominal + this.accelXOffset + accelXJitter).toFixed(2));
    const accelY = Number((base.accelYNominal + this.accelYOffset + accelYJitter).toFixed(2));

    const gyroX = Number((this.gyroXOffset + gyroJitter).toFixed(2));
    const gyroY = Number((this.gyroYOffset + gyroJitter).toFixed(2));
    const gyroZ = Number((this.gyroZOffset + (gyroJitter * 0.5)).toFixed(2));

    const vibration = Math.max(2, Math.min(100, Math.round(base.vibrationNominal + this.vibrationOffset + vibJitter)));

    return {
      timestamp: new Date().toISOString(),
      ultrasonicDistance,
      acceleration: { x: accelX, y: accelY, z: accelZ },
      gyroscope: { x: gyroX, y: gyroY, z: gyroZ },
      vibration,
      gps: {
        latitude: Number(this.currentLat.toFixed(6)),
        longitude: Number(this.currentLng.toFixed(6)),
        speed: Number(this.currentSpeed.toFixed(1)),
        heading: Number(this.currentHeading.toFixed(1)),
        isLocked: true,
      },
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.latestReading);
      } catch (err) {
        console.error('Error in sensor listener:', err);
      }
    }
  }

  private updateSequenceState(state: SimulationSequenceState): void {
    this.currentSequenceState = state;
    for (const listener of this.sequenceListeners) {
      try {
        listener(this.currentSequenceState);
      } catch (err) {
        console.error('Error in sequence state listener:', err);
      }
    }
  }

  /**
   * Execute controlled 8-phase realistic sequence
   */
  public triggerScenario(scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe'): void {
    if (!this.running) {
      this.start();
    }

    if (this.activeSequenceTimeout !== null) {
      clearTimeout(this.activeSequenceTimeout);
      this.activeSequenceTimeout = null;
    }

    const scenarioLabels: Record<string, string> = {
      normal: 'Normal Road Condition',
      rough: 'Rough Road Surface',
      small: 'Small Pothole Event',
      medium: 'Medium Pothole Event',
      severe: 'Severe Deep Pothole Event',
    };

    const name = scenarioLabels[scenario] || 'Road Event';

    // Phase 1: Normal Baseline
    this.updateSequenceState({
      sequenceName: name,
      phase: 1,
      phaseTitle: 'Phase 1: Normal Road Readings',
      phaseDescription: 'Baseline sensor readings on smooth asphalt. Distance ~21cm, Accel Z ~9.8m/s², Vibration ~12.',
      totalPhases: 8,
      isActive: true,
    });
    this.resetOffsets();

    // Helper step scheduler
    const scheduleStep = (phase: number, delayMs: number, title: string, desc: string, action: () => void) => {
      return new Promise<void>((resolve) => {
        this.activeSequenceTimeout = window.setTimeout(() => {
          this.updateSequenceState({
            sequenceName: name,
            phase,
            phaseTitle: `Phase ${phase}: ${title}`,
            phaseDescription: desc,
            totalPhases: 8,
            isActive: true,
          });
          action();
          resolve();
        }, delayMs);
      });
    };

    // Execute step sequence according to scenario parameters
    (async () => {
      // Phase 2: Gradual Approach
      await scheduleStep(
        2,
        600,
        'Vehicle Approach',
        'Vehicle approaches road zone. Minor tire vibrations and slight ground clearance variance.',
        () => {
          if (scenario === 'rough') {
            this.distanceOffset = 2.5;
            this.vibrationOffset = 15;
            this.accelZOffset = 1.2;
          } else if (scenario === 'small') {
            this.distanceOffset = 1.5;
            this.vibrationOffset = 10;
          } else if (scenario === 'medium') {
            this.distanceOffset = 2.0;
            this.vibrationOffset = 18;
          } else if (scenario === 'severe') {
            this.distanceOffset = 3.0;
            this.vibrationOffset = 25;
            this.accelZOffset = 1.8;
          }
        }
      );

      // Phase 3: Ultrasonic depth drop
      await scheduleStep(
        3,
        700,
        'Ultrasonic Depth Detection',
        'HC-SR04 downward beam enters road depression cavity. Depth distance spikes instantaneously.',
        () => {
          if (scenario === 'normal') {
            this.distanceOffset = 0;
          } else if (scenario === 'rough') {
            this.distanceOffset = 4.5;
          } else if (scenario === 'small') {
            this.distanceOffset = 7.5; // ~28.5cm total
          } else if (scenario === 'medium') {
            this.distanceOffset = 14.0; // ~35.0cm total
          } else if (scenario === 'severe') {
            this.distanceOffset = 27.5; // ~48.5cm total
          }
        }
      );

      // Phase 4: Accelerometer shock spike
      await scheduleStep(
        4,
        600,
        'MPU9250 Accelerometer Shock',
        'Tire drops into cavity; suspension compresses and recoils. Sharp vertical (Z) jerk detected.',
        () => {
          if (scenario === 'normal') {
            this.accelZOffset = 0;
          } else if (scenario === 'rough') {
            this.accelZOffset = 2.5;
            this.accelXOffset = 0.8;
          } else if (scenario === 'small') {
            this.accelZOffset = 4.2;
            this.accelXOffset = 1.2;
            this.gyroYOffset = 3.5;
          } else if (scenario === 'medium') {
            this.accelZOffset = 7.8;
            this.accelXOffset = 2.5;
            this.gyroYOffset = 6.2;
          } else if (scenario === 'severe') {
            this.accelZOffset = 12.5; // ~22.3 m/s^2 shock spike
            this.accelXOffset = 4.1;
            this.accelYOffset = 3.2;
            this.gyroYOffset = 11.4;
            this.gyroXOffset = 8.5;
          }
        }
      );

      // Phase 5: Piezo Vibration burst
      await scheduleStep(
        5,
        500,
        'Vibration Sensor Burst',
        'Piezoelectric transducer registers structural chassis shock wave oscillation.',
        () => {
          if (scenario === 'normal') {
            this.vibrationOffset = 0;
          } else if (scenario === 'rough') {
            this.vibrationOffset = 35; // total ~47
          } else if (scenario === 'small') {
            this.vibrationOffset = 45; // total ~57
          } else if (scenario === 'medium') {
            this.vibrationOffset = 65; // total ~77
          } else if (scenario === 'severe') {
            this.vibrationOffset = 82; // total ~94
          }
        }
      );

      // Phase 6: Detection Engine Sensor Fusion Confirmation
      await scheduleStep(
        6,
        600,
        'Sensor Fusion Confirmation',
        'Weighted Anomaly Matrix correlates ultrasonic, vertical acceleration, and vibration data.',
        () => {
          // Keep sensor values at peak for detection confirmation snapshot
        }
      );

      // Phase 7: GPS Geotagging & Telemetry Snapshot
      await scheduleStep(
        7,
        600,
        'GPS Geotagging & Logging',
        'Coordinates, vehicle speed, timestamp and full telemetry payload recorded and stored.',
        () => {
          // Begin dampening offsets back towards baseline
          this.distanceOffset *= 0.3;
          this.accelZOffset *= 0.3;
          this.accelXOffset = 0;
          this.accelYOffset = 0;
          this.gyroXOffset = 0;
          this.gyroYOffset = 0;
          this.vibrationOffset *= 0.4;
        }
      );

      // Phase 8: Dashboard Updates & Normalization
      await scheduleStep(
        8,
        800,
        'Dashboard & Road Health Update',
        'Road Health Score recalculated, map marker dropped, detection history updated.',
        () => {
          this.resetOffsets();
          setTimeout(() => {
            this.updateSequenceState({
              sequenceName: null,
              phase: 0,
              phaseTitle: 'Sequence Complete',
              phaseDescription: 'Normal cruising resumed.',
              totalPhases: 8,
              isActive: false,
            });
          }, 1500);
        }
      );
    })();
  }
}
