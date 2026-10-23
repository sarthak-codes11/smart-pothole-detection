import { SensorReading, SimulationSequenceState } from '../types';

export type SensorDataListener = (reading: SensorReading) => void;
export type SequenceStateListener = (state: SimulationSequenceState) => void;

/**
 * Pluggable Sensor Service Interface
 * All sensor data sources (Simulated, ESP32 Serial, ESP32 WebSocket, ESP32 HTTP)
 * must implement this interface to integrate seamlessly with the UI and Detection Engine.
 */
export interface ISensorService {
  /**
   * Subscribe to incoming telemetry packets (emitted every 300-500ms).
   */
  subscribe(listener: SensorDataListener): () => void;

  /**
   * Subscribe to simulation sequence lifecycle events (for multi-phase demonstration).
   */
  subscribeSequence(listener: SequenceStateListener): () => void;

  /**
   * Start or resume the data generation stream.
   */
  start(): void;

  /**
   * Pause data generation stream.
   */
  pause(): void;

  /**
   * Reset simulation state and vehicle position.
   */
  reset(): void;

  /**
   * Check if the stream is currently actively ticking.
   */
  isRunning(): boolean;

  /**
   * Trigger a specific realistic road anomaly sequence.
   */
  triggerScenario(scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe'): void;

  /**
   * Get current latest reading synchronously, or null if no telemetry has been received.
   */
  getCurrentReading(): SensorReading | null;

  /**
   * Source name identifier for UI status indicators.
   */
  getSourceName(): 'DISCONNECTED' | 'SIMULATED' | 'ESP32_HARDWARE';
}
