import { ISensorService, SensorDataListener, SequenceStateListener } from './SensorService';
import {
  SensorReading,
  HardwareConnectionStatus,
  HardwareConnectionType,
} from '../types';

export type HardwareStatusListener = (status: HardwareConnectionStatus, errorMsg?: string) => void;

/**
 * Authoritative regex for the ESP32 Arduino firmware serial protocol:
 * Format:
 * "Recorded reading 5 | Distance 37.8 cm | Vibration 1.4 g | Status: POTHOLE DETECTED"
 * "Recorded reading 1 | Distance 25.1 cm | Vibration 0.1 g | Status: NORMAL"
 */
export const ESP32_FIRMWARE_REGEX = /^Recorded\s+reading\s+(\d+)\s*\|\s*Distance\s+([\d.]+)\s*cm\s*\|\s*Vibration\s+([\d.]+)\s*g\s*\|\s*Status:\s*(NORMAL|POTHOLE DETECTED)$/i;

/**
 * Physical ESP32 Hardware Sensor Bridge
 * Supports USB Direct Serial Streaming (Web Serial API at 115200 baud)
 * and Wi-Fi WebSocket streaming (ws://192.168.4.1:81).
 */
export class Esp32SensorService implements ISensorService {
  private listeners: Set<SensorDataListener> = new Set();
  private statusListeners: Set<HardwareStatusListener> = new Set();
  private isConnected: boolean = false;
  private connectionStatus: HardwareConnectionStatus = 'DISCONNECTED';
  private connectionType: HardwareConnectionType | null = null;
  private ws: WebSocket | null = null;
  private serialPort: any = null;
  private serialReader: any = null;
  private keepReadingSerial: boolean = false;
  private endpointUrl: string;
  private latestReading: SensorReading | null = null;

  // Telemetry diagnostics counters
  private validPacketsCount: number = 0;
  private ignoredLinesCount: number = 0;
  private lastRawLine: string = '';
  private hasReceivedFirstValidReading: boolean = false;

  constructor(endpointUrl: string = 'ws://192.168.4.1:81') {
    this.endpointUrl = endpointUrl;
  }

  public subscribe(listener: SensorDataListener): () => void {
    this.listeners.add(listener);
    if (this.latestReading) {
      listener(this.latestReading);
    }
    return () => this.listeners.delete(listener);
  }

  public subscribeSequence(_listener: SequenceStateListener): () => void {
    return () => {};
  }

  public subscribeStatus(listener: HardwareStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.connectionStatus);
    return () => this.statusListeners.delete(listener);
  }

  public setEndpoint(url: string): void {
    this.endpointUrl = url;
  }

  public getEndpoint(): string {
    return this.endpointUrl;
  }

  public getConnectionStatus(): HardwareConnectionStatus {
    return this.connectionStatus;
  }

  public getConnectionType(): HardwareConnectionType | null {
    return this.connectionType;
  }

  public isHardwareConnected(): boolean {
    return this.connectionStatus === 'CONNECTED' || this.connectionStatus === 'AWAITING_TELEMETRY';
  }

  public isReceivingTelemetry(): boolean {
    return this.connectionStatus === 'CONNECTED';
  }

  public isRunning(): boolean {
    return this.isConnected;
  }

  public getSourceName(): 'DISCONNECTED' | 'SIMULATED' | 'ESP32_HARDWARE' {
    return 'ESP32_HARDWARE';
  }

  public getCurrentReading(): SensorReading | null {
    return this.latestReading;
  }

  public getValidPacketsCount(): number {
    return this.validPacketsCount;
  }

  public getIgnoredLinesCount(): number {
    return this.ignoredLinesCount;
  }

  public getLastRawLine(): string {
    return this.lastRawLine;
  }

  public triggerScenario(): void {
    console.info('[ESP32 Hardware] Scenario triggers disabled in genuine hardware mode.');
  }

  public start(): void {
    if (!this.isConnected) {
      this.connectWebSocket(this.endpointUrl);
    }
  }

  public pause(): void {
    this.disconnect();
  }

  public reset(): void {
    this.disconnect();
    this.latestReading = null;
    this.validPacketsCount = 0;
    this.ignoredLinesCount = 0;
    this.lastRawLine = '';
    this.hasReceivedFirstValidReading = false;
  }

  /**
   * Connect via Web Serial API at 115200 baud
   */
  public async connectSerial(baudRate = 115200): Promise<boolean> {
    await this.disconnect();

    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      this.connectionStatus = 'ERROR';
      this.notifyStatus('ERROR', 'Web Serial API is not supported in this browser. Please use a Chromium-based browser like Google Chrome, Microsoft Edge, Opera, or Brave.');
      return false;
    }

    try {
      this.connectionStatus = 'CONNECTING';
      this.notifyStatus('CONNECTING', 'Requesting serial port access...');

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });

      this.serialPort = port;
      this.keepReadingSerial = true;
      this.connectionType = 'SERIAL';
      this.hasReceivedFirstValidReading = false;

      // Port is opened, now waiting for authoritative telemetry line
      this.connectionStatus = 'AWAITING_TELEMETRY';
      this.notifyStatus('AWAITING_TELEMETRY', 'Serial port opened at 115200 baud. Waiting for first ESP32 telemetry line...');

      // Start continuous background read loop
      this.readSerialLoop();
      return true;
    } catch (err: any) {
      this.isConnected = false;
      this.connectionType = null;
      this.keepReadingSerial = false;

      if (err?.name === 'NotFoundError') {
        // User cancelled the native port selector
        this.connectionStatus = 'DISCONNECTED';
        this.notifyStatus('DISCONNECTED', 'Serial port selection cancelled.');
        return false;
      } else if (err?.name === 'SecurityError') {
        this.connectionStatus = 'ERROR';
        this.notifyStatus('ERROR', 'Access to serial port was denied.');
        return false;
      } else {
        this.connectionStatus = 'ERROR';
        this.notifyStatus('ERROR', err?.message || 'Failed to open serial port.');
        return false;
      }
    }
  }

  /**
   * Continuous serial read loop:
   * Handles arbitrary chunk boundaries, CRLF/LF line endings, and buffers incomplete text.
   */
  private async readSerialLoop(): Promise<void> {
    if (!this.serialPort?.readable) {
      this.connectionStatus = 'ERROR';
      this.notifyStatus('ERROR', 'Selected serial port is not readable.');
      return;
    }

    let reader: any = null;
    let buffer = '';
    const textDecoder = new TextDecoder();

    try {
      reader = this.serialPort.readable.getReader();
      this.serialReader = reader;

      while (this.keepReadingSerial) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          buffer += textDecoder.decode(value, { stream: true });

          // Split on both CRLF (\r\n) and LF (\n)
          const lines = buffer.split(/\r?\n/);
          // The last element is unfinished text until the next newline arrives
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            this.lastRawLine = trimmed;
            const parsed = this.parseFirmwareLine(trimmed);

            if (parsed) {
              this.validPacketsCount++;

              // Transition to CONNECTED (Receiving Telemetry) upon first valid line
              if (!this.hasReceivedFirstValidReading) {
                this.hasReceivedFirstValidReading = true;
                this.isConnected = true;
                this.connectionStatus = 'CONNECTED';
                this.notifyStatus('CONNECTED', 'Receiving telemetry from physical ESP32.');
              }

              this.latestReading = parsed;
              for (const listener of this.listeners) {
                listener(parsed);
              }
            } else {
              // Ignore startup text (e.g. ROAD MONITOR, INITIALIZING...) or malformed lines
              this.ignoredLinesCount++;
            }
          }
        }
      }
    } catch (err: any) {
      if (this.keepReadingSerial) {
        console.warn('[ESP32 Serial] Read loop terminated unexpectedly:', err);
        this.connectionStatus = 'CONNECTION_LOST';
        this.notifyStatus('CONNECTION_LOST', `Serial connection lost: ${err?.message || 'Port disconnected'}`);
      }
    } finally {
      if (reader) {
        try {
          reader.releaseLock();
        } catch {}
        this.serialReader = null;
      }
      if (this.connectionStatus === 'CONNECTED' || this.connectionStatus === 'AWAITING_TELEMETRY') {
        this.isConnected = false;
        this.connectionStatus = 'DISCONNECTED';
        this.notifyStatus('DISCONNECTED');
      }
    }
  }

  /**
   * Parse a single serial line according to authoritative firmware specification:
   * "Recorded reading <N> | Distance <D> cm | Vibration <V> g | Status: <NORMAL|POTHOLE DETECTED>"
   */
  public parseFirmwareLine(line: string): SensorReading | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const match = trimmed.match(ESP32_FIRMWARE_REGEX);
    if (!match) {
      // Also support JSON format if a future or alternate firmware sends JSON
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const raw = JSON.parse(trimmed);
          return this.mapEsp32JsonPayload(raw);
        } catch {
          return null;
        }
      }
      return null;
    }

    const readingNumber = parseInt(match[1], 10);
    const distanceCm = parseFloat(match[2]);
    const vibrationG = parseFloat(match[3]);
    const rawStatus = match[4].toUpperCase();
    const isPothole = rawStatus === 'POTHOLE DETECTED';

    return {
      timestamp: new Date().toISOString(),
      source: 'HARDWARE',
      isSimulated: false,
      isPlayback: true,
      readingNumber,
      sequenceNumber: readingNumber,
      ultrasonicDistance: distanceCm,
      vibrationG,
      vibration: vibrationG,
      statusText: isPothole ? 'POTHOLE DETECTED' : 'NORMAL',
      isPotholeDetected: isPothole,
      // Unavailable on current firmware playback protocol - represented honestly as null / false:
      acceleration: {
        x: null,
        y: null,
        z: null,
        isAvailable: false,
      },
      gyroscope: {
        x: null,
        y: null,
        z: null,
        isAvailable: false,
      },
      gps: {
        latitude: null,
        longitude: null,
        speed: null,
        heading: null,
        isLocked: false,
        satellites: null,
        isSimulated: false,
        isAvailable: false,
      },
    };
  }

  /**
   * Connect via Wi-Fi WebSocket (ws://192.168.4.1:81)
   */
  public async connectWebSocket(url?: string): Promise<boolean> {
    if (url) this.endpointUrl = url;
    await this.disconnect();

    this.connectionStatus = 'CONNECTING';
    this.notifyStatus('CONNECTING', `Connecting to WebSocket at ${this.endpointUrl}...`);

    return new Promise((resolve) => {
      let resolved = false;
      const timeout = window.setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.connectionStatus = 'ERROR';
          this.notifyStatus('ERROR', `Connection to ${this.endpointUrl} timed out. Ensure ESP32 Wi-Fi AP is active.`);
          resolve(false);
        }
      }, 5000);

      try {
        this.ws = new WebSocket(this.endpointUrl);

        this.ws.onopen = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.connectionType = 'WEBSOCKET';
            this.hasReceivedFirstValidReading = false;
            this.connectionStatus = 'AWAITING_TELEMETRY';
            this.notifyStatus('AWAITING_TELEMETRY', 'WebSocket open. Awaiting telemetry frames...');
            resolve(true);
          }
        };

        this.ws.onmessage = (event) => {
          const rawText = String(event.data || '').trim();
          this.lastRawLine = rawText;
          const parsed = this.parseFirmwareLine(rawText);

          if (parsed) {
            this.validPacketsCount++;
            if (!this.hasReceivedFirstValidReading) {
              this.hasReceivedFirstValidReading = true;
              this.isConnected = true;
              this.connectionStatus = 'CONNECTED';
              this.notifyStatus('CONNECTED', 'Receiving telemetry from physical ESP32.');
            }
            this.latestReading = parsed;
            for (const listener of this.listeners) {
              listener(parsed);
            }
          } else {
            this.ignoredLinesCount++;
          }
        };

        this.ws.onerror = (_err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            this.isConnected = false;
            this.connectionStatus = 'ERROR';
            this.notifyStatus('ERROR', `Could not reach ${this.endpointUrl}. Check IP & Wi-Fi.`);
            resolve(false);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          if (this.connectionStatus === 'CONNECTED' || this.connectionStatus === 'AWAITING_TELEMETRY') {
            this.connectionStatus = 'CONNECTION_LOST';
            this.notifyStatus('CONNECTION_LOST', 'WebSocket connection closed.');
          }
        };
      } catch (err: any) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          this.isConnected = false;
          this.connectionStatus = 'ERROR';
          this.notifyStatus('ERROR', err?.message || 'WebSocket initialization failed.');
          resolve(false);
        }
      }
    });
  }

  /**
   * Release reader, close serial port, and close websocket
   */
  public async disconnect(): Promise<void> {
    this.keepReadingSerial = false;

    if (this.serialReader) {
      try {
        await this.serialReader.cancel();
      } catch {}
      try {
        this.serialReader.releaseLock();
      } catch {}
      this.serialReader = null;
    }

    if (this.serialPort) {
      try {
        await this.serialPort.close();
      } catch {}
      this.serialPort = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.isConnected = false;
    this.connectionType = null;
    this.hasReceivedFirstValidReading = false;
    this.connectionStatus = 'DISCONNECTED';
    this.notifyStatus('DISCONNECTED');
  }

  private notifyStatus(status: HardwareConnectionStatus, msg?: string): void {
    this.connectionStatus = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status, msg);
      } catch (e) {
        console.error('Error in status listener:', e);
      }
    }
  }

  private mapEsp32JsonPayload(raw: any): SensorReading {
    return {
      timestamp: raw.timestamp || new Date().toISOString(),
      source: 'HARDWARE',
      isSimulated: false,
      isPlayback: false,
      sequenceNumber: raw.sequenceNumber,
      readingNumber: raw.readingNumber ?? raw.sequenceNumber,
      ultrasonicDistance: Number(raw.ultrasonicDistance ?? 21.0),
      vibrationG: Number(raw.vibrationG ?? (raw.vibration ? raw.vibration / 50 : 0.2)),
      vibration: Number(raw.vibration ?? 10),
      statusText: raw.statusText || (raw.isPothole ? 'POTHOLE DETECTED' : 'NORMAL'),
      isPotholeDetected: Boolean(raw.isPothole),
      acceleration: {
        x: raw.acceleration ? Number(raw.acceleration.x ?? 0) : null,
        y: raw.acceleration ? Number(raw.acceleration.y ?? 0) : null,
        z: raw.acceleration ? Number(raw.acceleration.z ?? 9.81) : null,
        isAvailable: Boolean(raw.acceleration),
      },
      gyroscope: {
        x: raw.gyroscope ? Number(raw.gyroscope.x ?? 0) : null,
        y: raw.gyroscope ? Number(raw.gyroscope.y ?? 0) : null,
        z: raw.gyroscope ? Number(raw.gyroscope.z ?? 0) : null,
        isAvailable: Boolean(raw.gyroscope),
      },
      gps: {
        latitude: raw.gps ? Number(raw.gps.latitude ?? 0) : null,
        longitude: raw.gps ? Number(raw.gps.longitude ?? 0) : null,
        speed: raw.gps ? Number(raw.gps.speed ?? 0) : null,
        heading: raw.gps ? Number(raw.gps.heading ?? 0) : null,
        isLocked: Boolean(raw.gps?.isLocked),
        isSimulated: false,
        isAvailable: Boolean(raw.gps?.isLocked),
      },
    };
  }
}
