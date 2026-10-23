import { ISensorService, SensorDataListener, SequenceStateListener } from './SensorService';
import { SensorReading, SimulationSequenceState } from '../types';

/**
 * Expected JSON payload format transmitted by the physical ESP32 MCU over
 * Serial (UART / USB), WebSockets, or HTTP POST stream:
 *
 * {
 *   "timestamp": "2026-09-18T17:00:00.000Z",
 *   "ultrasonicDistance": 21.4,
 *   "acceleration": {
 *     "x": 0.2,
 *     "y": 0.1,
 *     "z": 9.7
 *   },
 *   "gyroscope": {
 *     "x": 0.1,
 *     "y": 0.3,
 *     "z": 0.2
 *   },
 *   "vibration": 12,
 *   "gps": {
 *     "latitude": 16.5000,
 *     "longitude": 80.6000,
 *     "speed": 18.5,
 *     "heading": 45.0,
 *     "isLocked": true
 *   }
 * }
 */
export class Esp32SensorService implements ISensorService {
  private listeners: Set<SensorDataListener> = new Set();
  private isConnected: boolean = false;
  private ws: WebSocket | null = null;
  private endpointUrl: string;

  constructor(endpointUrl: string = 'ws://192.168.4.1:81') {
    this.endpointUrl = endpointUrl;
  }

  public subscribe(listener: SensorDataListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeSequence(_listener: SequenceStateListener): () => void {
    return () => {};
  }

  public start(): void {
    if (this.isConnected) return;
    try {
      this.ws = new WebSocket(this.endpointUrl);
      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[ESP32 Bridge] Connected to physical MCU hardware at', this.endpointUrl);
      };
      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const reading: SensorReading = this.mapEsp32Payload(raw);
          for (const listener of this.listeners) {
            listener(reading);
          }
        } catch (parseError) {
          console.error('[ESP32 Bridge] Error parsing incoming sensor JSON frame:', parseError);
        }
      };
      this.ws.onclose = () => {
        this.isConnected = false;
        console.warn('[ESP32 Bridge] Connection lost to MCU hardware.');
      };
    } catch (err) {
      console.error('[ESP32 Bridge] Failed to initialize hardware socket:', err);
    }
  }

  public pause(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  public reset(): void {
    this.pause();
  }

  public isRunning(): boolean {
    return this.isConnected;
  }

  public getSourceName(): 'SIMULATED' | 'ESP32_HARDWARE' {
    return 'ESP32_HARDWARE';
  }

  public triggerScenario(): void {
    console.info('[ESP32 Hardware] Scenario triggers are only applicable in Simulation mode.');
  }

  public getCurrentReading(): SensorReading {
    return {
      timestamp: new Date().toISOString(),
      ultrasonicDistance: 21.0,
      acceleration: { x: 0, y: 0, z: 9.81 },
      gyroscope: { x: 0, y: 0, z: 0 },
      vibration: 12,
      gps: { latitude: 16.5062, longitude: 80.6480, speed: 0, heading: 0, isLocked: false },
    };
  }

  private mapEsp32Payload(raw: any): SensorReading {
    return {
      timestamp: raw.timestamp || new Date().toISOString(),
      ultrasonicDistance: Number(raw.ultrasonicDistance ?? 21.0),
      acceleration: {
        x: Number(raw.acceleration?.x ?? 0),
        y: Number(raw.acceleration?.y ?? 0),
        z: Number(raw.acceleration?.z ?? 9.81),
      },
      gyroscope: {
        x: Number(raw.gyroscope?.x ?? 0),
        y: Number(raw.gyroscope?.y ?? 0),
        z: Number(raw.gyroscope?.z ?? 0),
      },
      vibration: Number(raw.vibration ?? 10),
      gps: {
        latitude: Number(raw.gps?.latitude ?? 16.5062),
        longitude: Number(raw.gps?.longitude ?? 80.6480),
        speed: Number(raw.gps?.speed ?? 0),
        heading: Number(raw.gps?.heading ?? 0),
        isLocked: Boolean(raw.gps?.isLocked ?? true),
      },
    };
  }
}
