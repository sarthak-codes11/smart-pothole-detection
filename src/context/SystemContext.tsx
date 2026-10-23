import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  SensorReading,
  DetectionResult,
  PotholeEvent,
  RoadHealthMetrics,
  SimulationSequenceState,
  PotholeStatus,
} from '../types';
import { ISensorService } from '../services/SensorService';
import { SimulatedSensorService } from '../services/SimulatedSensorService';
import { DetectionEngine } from '../services/DetectionEngine';
import { StorageService } from '../services/StorageService';
import { RoadHealthEngine } from '../services/RoadHealthEngine';
import confetti from 'canvas-confetti';

export type NavigationTab =
  | 'dashboard'
  | 'live'
  | 'simulation'
  | 'map'
  | 'history'
  | 'analytics'
  | 'status';

export interface ToastMessage {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: string;
}

interface SystemContextType {
  currentReading: SensorReading;
  telemetryHistory: SensorReading[];
  detectionResult: DetectionResult;
  potholeEvents: PotholeEvent[];
  roadHealth: RoadHealthMetrics;
  sequenceState: SimulationSequenceState;
  isStreamRunning: boolean;
  isDemoMode: boolean;
  buzzerEnabled: boolean;
  activeTab: NavigationTab;
  toasts: ToastMessage[];
  lastDetectedEvent: PotholeEvent | null;
  sensorService: ISensorService;
  
  // Actions
  setActiveTab: (tab: NavigationTab) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  triggerScenario: (scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe') => void;
  startDemoMode: () => void;
  stopDemoMode: () => void;
  updateEventStatus: (eventId: string, newStatus: PotholeStatus, notes?: string) => void;
  deleteEvent: (eventId: string) => void;
  resetToSeedEvents: () => void;
  toggleBuzzer: () => void;
  dismissToast: (id: string) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// Web Audio API Piezo Buzzer Sound Generator
const playBuzzerAlert = (frequency = 2400, duration = 0.12, repetitions = 2) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    for (let i = 0; i < repetitions; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; // Harsh square wave like hardware piezo buzzer
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + i * 0.18);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + duration);
    }
  } catch {
    // Audio might be muted by browser policy before user interaction
  }
};

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Service instances
  const sensorServiceRef = useRef<ISensorService>(new SimulatedSensorService());
  const detectionEngineRef = useRef<DetectionEngine>(new DetectionEngine());

  // State
  const [currentReading, setCurrentReading] = useState<SensorReading>(() =>
    sensorServiceRef.current.getCurrentReading()
  );
  const [telemetryHistory, setTelemetryHistory] = useState<SensorReading[]>([]);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    condition: 'NORMAL',
    confidence: 0,
    severity: null,
    reasons: ['System standing by on baseline road surface'],
    distanceAnomalyContribution: 0,
    accelAnomalyContribution: 0,
    vibrationContribution: 0,
    isPotholeConfirmed: false,
  });

  const [potholeEvents, setPotholeEvents] = useState<PotholeEvent[]>(() =>
    StorageService.loadEvents()
  );
  const [roadHealth, setRoadHealth] = useState<RoadHealthMetrics>(() =>
    RoadHealthEngine.calculateMetrics(StorageService.loadEvents())
  );
  const [sequenceState, setSequenceState] = useState<SimulationSequenceState>({
    sequenceName: null,
    phase: 0,
    phaseTitle: 'Idle Normal Stream',
    phaseDescription: 'Vehicle cruising smoothly on inspected route.',
    totalPhases: 8,
    isActive: false,
  });

  const [isStreamRunning, setIsStreamRunning] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [buzzerEnabled, setBuzzerEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastDetectedEvent, setLastDetectedEvent] = useState<PotholeEvent | null>(null);

  const demoTimeoutsRef = useRef<number[]>([]);

  // Toast dispatcher
  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message: string) => {
      const newToast: ToastMessage = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        title,
        message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Recalculate road health when potholeEvents change
  useEffect(() => {
    const metrics = RoadHealthEngine.calculateMetrics(potholeEvents);
    setRoadHealth(metrics);
  }, [potholeEvents]);

  // Hook sensor stream
  useEffect(() => {
    const sensor = sensorServiceRef.current;
    const engine = detectionEngineRef.current;

    const unsubscribeData = sensor.subscribe((reading) => {
      setCurrentReading(reading);

      // Add to rolling history (keep latest 35 entries for charts)
      setTelemetryHistory((prev) => {
        const next = [...prev, reading];
        if (next.length > 35) next.shift();
        return next;
      });

      // Run detection engine sensor fusion evaluation
      const { result, newEvent } = engine.evaluate(reading);
      setDetectionResult(result);

      if (newEvent) {
        setLastDetectedEvent(newEvent);
        // Persist to local storage
        const updated = StorageService.addEvent(newEvent);
        setPotholeEvents(updated);

        // Play hardware buzzer sound
        if (buzzerEnabled) {
          playBuzzerAlert(
            newEvent.severity === 'HIGH' ? 2800 : newEvent.severity === 'MEDIUM' ? 2200 : 1800,
            0.15,
            newEvent.severity === 'HIGH' ? 3 : 2
          );
        }

        // Trigger toast
        addToast(
          newEvent.severity === 'HIGH' ? 'danger' : newEvent.severity === 'MEDIUM' ? 'warning' : 'info',
          `Pothole Detected: ${newEvent.severity} Severity`,
          `${newEvent.roadSegmentName} | Est. Depth: ${newEvent.estimatedDepth} | Conf: ${newEvent.confidence}%`
        );
      }
    });

    const unsubscribeSeq = sensor.subscribeSequence((seq) => {
      setSequenceState(seq);
    });

    return () => {
      unsubscribeData();
      unsubscribeSeq();
    };
  }, [buzzerEnabled, addToast]);

  // Automatically start sensor stream on initial mount
  useEffect(() => {
    sensorServiceRef.current.start();
    setIsStreamRunning(true);
    addToast(
      'info',
      'Simulation Stream Initialized',
      'Sensor data is currently simulated. ESP32 hardware bridge is ready.'
    );
  }, [addToast]);

  const startSimulation = () => {
    sensorServiceRef.current.start();
    setIsStreamRunning(true);
  };

  const pauseSimulation = () => {
    sensorServiceRef.current.pause();
    setIsStreamRunning(false);
  };

  const resetSimulation = () => {
    sensorServiceRef.current.reset();
    detectionEngineRef.current.reset();
    setIsStreamRunning(false);
    setTelemetryHistory([]);
    setDetectionResult({
      condition: 'NORMAL',
      confidence: 0,
      severity: null,
      reasons: ['System reset to origin'],
      distanceAnomalyContribution: 0,
      accelAnomalyContribution: 0,
      vibrationContribution: 0,
      isPotholeConfirmed: false,
    });
    addToast('info', 'Simulation Reset', 'Vehicle returned to starting coordinates.');
  };

  const triggerScenario = (scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe') => {
    sensorServiceRef.current.triggerScenario(scenario);
    setIsStreamRunning(true);
  };

  const clearDemoTimeouts = () => {
    demoTimeoutsRef.current.forEach((t) => clearTimeout(t));
    demoTimeoutsRef.current = [];
  };

  const startDemoMode = () => {
    clearDemoTimeouts();
    setIsDemoMode(true);
    sensorServiceRef.current.start();
    setIsStreamRunning(true);

    addToast('info', 'Demo Mode Activated', 'Starting automated multi-condition demonstration sequence...');

    // Step 1: Normal Road
    triggerScenario('normal');

    // Step 2: Rough Road after 4 seconds
    const t1 = window.setTimeout(() => {
      triggerScenario('rough');
      addToast('info', 'Demo Step 1/3', 'Simulating Rough Road Surface condition...');
    }, 4500);

    // Step 3: Medium Pothole after 11 seconds
    const t2 = window.setTimeout(() => {
      triggerScenario('medium');
      addToast('warning', 'Demo Step 2/3', 'Approaching and detecting Medium Pothole...');
    }, 11500);

    // Step 4: Severe Pothole after 19 seconds
    const t3 = window.setTimeout(() => {
      triggerScenario('severe');
      addToast('danger', 'Demo Step 3/3', 'Simulating Severe Pothole Impact event!');
    }, 19000);

    // End of demo
    const t4 = window.setTimeout(() => {
      setIsDemoMode(false);
      addToast('success', 'Demo Mode Completed', 'Demonstration cycle finished. All data logged and persisted.');
    }, 28000);

    demoTimeoutsRef.current = [t1, t2, t3, t4];
  };

  const stopDemoMode = () => {
    clearDemoTimeouts();
    setIsDemoMode(false);
    addToast('info', 'Demo Mode Stopped', 'Automated sequence paused.');
  };

  const updateEventStatus = (eventId: string, newStatus: PotholeStatus, notes?: string) => {
    const updated = StorageService.updateEventStatus(eventId, newStatus, notes);
    setPotholeEvents(updated);
    if (newStatus === 'REPAIRED') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      addToast('success', 'Status Updated: REPAIRED', `Road Health Score recovered.`);
    } else {
      addToast('info', 'Status Updated', `Event marked as ${newStatus}.`);
    }
  };

  const deleteEvent = (eventId: string) => {
    const updated = StorageService.deleteEvent(eventId);
    setPotholeEvents(updated);
    addToast('warning', 'Event Deleted', `Pothole record removed from local storage.`);
  };

  const resetToSeedEvents = () => {
    const seeded = StorageService.resetToSeed();
    setPotholeEvents(seeded);
    addToast('info', 'Database Reset', 'Historical events restored to 9 baseline demo records.');
  };

  const toggleBuzzer = () => {
    setBuzzerEnabled((prev) => !prev);
    if (!buzzerEnabled) {
      playBuzzerAlert(2000, 0.1, 1);
    }
  };

  return (
    <SystemContext.Provider
      value={{
        currentReading,
        telemetryHistory,
        detectionResult,
        potholeEvents,
        roadHealth,
        sequenceState,
        isStreamRunning,
        isDemoMode,
        buzzerEnabled,
        activeTab,
        toasts,
        lastDetectedEvent,
        sensorService: sensorServiceRef.current,
        setActiveTab,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        triggerScenario,
        startDemoMode,
        stopDemoMode,
        updateEventStatus,
        deleteEvent,
        resetToSeedEvents,
        toggleBuzzer,
        dismissToast,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
