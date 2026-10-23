import { ISensorService, SensorDataListener, SequenceStateListener } from './SensorService';
import { SensorReading, SimulationSequenceState } from '../types';

/**
 * DisconnectedSensorService represents a hardware-ready but currently disconnected sensor state.
 * It emits NO synthetic or fabricated telemetry and provides honest status reporting.
 */
export class DisconnectedSensorService implements ISensorService {
  private listeners: Set<SensorDataListener> = new Set();
  private sequenceListeners: Set<SequenceStateListener> = new Set();

  public subscribe(listener: SensorDataListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeSequence(listener: SequenceStateListener): () => void {
    this.sequenceListeners.add(listener);
    listener({
      sequenceName: null,
      phase: 0,
      phaseTitle: 'Hardware Disconnected',
      phaseDescription: 'Awaiting genuine ESP32 hardware telemetry stream.',
      totalPhases: 0,
      isActive: false,
    });
    return () => this.sequenceListeners.delete(listener);
  }

  public start(): void {
    console.info('[DisconnectedSensorService] Standby: Awaiting physical hardware telemetry. Simulation is disabled.');
  }

  public pause(): void {}

  public reset(): void {}

  public isRunning(): boolean {
    return false;
  }

  public triggerScenario(): void {
    console.info('[DisconnectedSensorService] Scripted scenarios disabled. Awaiting physical hardware telemetry.');
  }

  public getCurrentReading(): SensorReading | null {
    return null;
  }

  public getSourceName(): 'DISCONNECTED' | 'SIMULATED' | 'ESP32_HARDWARE' {
    return 'DISCONNECTED';
  }
}
