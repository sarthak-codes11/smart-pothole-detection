import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  SensorReading,
  DetectionResult,
  PotholeEvent,
  RoadHealthMetrics,
  SimulationSequenceState,
  PotholeStatus,
  HardwareConnectionStatus,
  HardwareConnectionType,
  OperatingMode,
  AnalysisState,
  TelemetrySource,
} from '../types';
import { ISensorService } from '../services/SensorService';
import { Esp32SensorService } from '../services/Esp32SensorService';
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
  // Operating & Analysis States
  operatingMode: OperatingMode;
  analysisState: AnalysisState;
  isAnalyzing: boolean;
  isStreamRunning: boolean;
  isDemoMode: boolean;

  // Telemetry
  currentReading: SensorReading | null;
  telemetryHistory: SensorReading[];
  telemetrySource: TelemetrySource | 'NONE';
  detectionResult: DetectionResult;
  roadHealth: RoadHealthMetrics;
  sequenceState: SimulationSequenceState;
  ingestedPacketsCount: number;

  // Detections & Data Separation
  potholeEvents: PotholeEvent[]; // active events according to current mode
  verifiedEvents: PotholeEvent[]; // genuine hardware records
  demoEvents: PotholeEvent[]; // current demo session records
  lastDetectedEvent: PotholeEvent | null;
  quarantineNotice: string | null;

  // Hardware Status
  hardwareStatus: HardwareConnectionStatus;
  hardwareConnectionType: HardwareConnectionType | null;
  hardwareEndpoint: string;
  hardwareError: string | null;
  sensorService: ISensorService;
  buzzerEnabled: boolean;

  // Global UI
  activeTab: NavigationTab;
  toasts: ToastMessage[];
  isConnectModalOpen: boolean;

  // Mode & Hardware Actions
  setActiveTab: (tab: NavigationTab) => void;
  setIsConnectModalOpen: (open: boolean) => void;
  selectOperatingMode: (mode: OperatingMode) => void;
  launchSimulationDemo: () => void;
  exitSimulationDemo: () => void;
  connectHardware: (type?: HardwareConnectionType, endpoint?: string) => Promise<boolean>;
  disconnectHardware: () => void;
  setHardwareEndpoint: (endpoint: string) => void;

  // Analysis Controls
  startAnalysis: () => void;
  stopAnalysis: () => void;
  toggleAnalysis: () => void;

  // Data & Storage Actions
  updateEventStatus: (eventId: string, newStatus: PotholeStatus, notes?: string) => void;
  deleteEvent: (eventId: string) => void;
  clearAllEvents: () => void;
  clearDemoSession: () => void;
  clearVerifiedEvents: () => void;
  dismissQuarantineNotice: () => void;
  toggleBuzzer: () => void;
  dismissToast: (id: string) => void;

  // Simulation controls
  triggerScenario: (scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe') => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  startDemoMode: () => void;
  stopDemoMode: () => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Service instances
  const esp32ServiceRef = useRef<Esp32SensorService>(new Esp32SensorService());
  const simulatedServiceRef = useRef<SimulatedSensorService>(new SimulatedSensorService());
  const detectionEngineRef = useRef<DetectionEngine>(new DetectionEngine());

  // Operating Mode & Analysis State
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('STANDBY');
  const [analysisState, setAnalysisState] = useState<AnalysisState>('IDLE');
  const isAnalyzing = analysisState === 'RUNNING';

  // Hardware Connection State
  const [hardwareStatus, setHardwareStatus] = useState<HardwareConnectionStatus>('DISCONNECTED');
  const [hardwareConnectionType, setHardwareConnectionType] = useState<HardwareConnectionType | null>(null);
  const [hardwareEndpoint, setHardwareEndpoint] = useState<string>('ws://192.168.4.1:81');
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const [ingestedPacketsCount, setIngestedPacketsCount] = useState<number>(0);

  // Telemetry State
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<SensorReading[]>([]);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    condition: 'STANDBY',
    confidence: null,
    severity: null,
    reasons: ['System standing by: Select "Connect Hardware" or "Launch Simulation Demo" to begin.'],
    distanceAnomalyContribution: null,
    accelAnomalyContribution: null,
    vibrationContribution: null,
    isPotholeConfirmed: false,
  });

  // Separate Event Lists
  const [verifiedEvents, setVerifiedEvents] = useState<PotholeEvent[]>(() =>
    StorageService.loadVerifiedEvents()
  );
  const [demoEvents, setDemoEvents] = useState<PotholeEvent[]>(() =>
    StorageService.loadDemoEvents()
  );
  const [lastDetectedEvent, setLastDetectedEvent] = useState<PotholeEvent | null>(null);

  // Quarantine Notice
  const [quarantineNotice, setQuarantineNotice] = useState<string | null>(() =>
    StorageService.getQuarantineNotice()
  );

  // Simulation Sequence State
  const [sequenceState, setSequenceState] = useState<SimulationSequenceState>({
    sequenceName: null,
    phase: 0,
    phaseTitle: 'Standby',
    phaseDescription: 'Select operating mode to begin.',
    totalPhases: 0,
    isActive: false,
  });

  // Global UI State
  const [buzzerEnabled, setBuzzerEnabled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Active Pothole Events view based on operating mode
  const activeEvents = operatingMode === 'SIMULATION' ? demoEvents : verifiedEvents;

  // Road health dynamically calculated based on active events
  const [roadHealth, setRoadHealth] = useState<RoadHealthMetrics>(() =>
    RoadHealthEngine.calculateMetrics(StorageService.loadVerifiedEvents())
  );

  useEffect(() => {
    const metrics = RoadHealthEngine.calculateMetrics(activeEvents);
    setRoadHealth(metrics);
  }, [activeEvents, operatingMode]);

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
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const dismissQuarantineNotice = () => {
    StorageService.dismissQuarantineNotice();
    setQuarantineNotice(null);
  };

  // 1. ESP32 Status Listener
  useEffect(() => {
    const unsubscribeStatus = esp32ServiceRef.current.subscribeStatus((status, errorMsg) => {
      setHardwareStatus(status);
      setHardwareConnectionType(esp32ServiceRef.current.getConnectionType());
      if (errorMsg) {
        setHardwareError(errorMsg);
      } else if (status === 'CONNECTED' || status === 'AWAITING_TELEMETRY') {
        setHardwareError(null);
      }
      if (status === 'CONNECTION_LOST') {
        addToast('danger', 'Connection Lost', errorMsg || 'ESP32 serial connection lost. Please reconnect.');
      }
    });

    return () => {
      unsubscribeStatus();
    };
  }, [addToast]);

  // Shared frame processor
  const handleIncomingReading = useCallback(
    (reading: SensorReading) => {
      setIngestedPacketsCount((prev) => prev + 1);
      setCurrentReading(reading);

      // Only perform detection engine evaluation if analysis is running
      if (analysisState !== 'RUNNING') {
        return;
      }

      // Add to rolling history (keep latest 35 entries for charts)
      setTelemetryHistory((prev) => {
        const next = [...prev, reading];
        if (next.length > 35) next.shift();
        return next;
      });

      // Run multi-sensor fusion evaluation
      const { result, newEvent } = detectionEngineRef.current.evaluate(reading);
      setDetectionResult(result);

      if (newEvent) {
        setLastDetectedEvent(newEvent);

        if (reading.source === 'SIMULATION') {
          // Persist to separate demo session storage
          const updated = StorageService.addDemoEvent(newEvent);
          setDemoEvents(updated);
          addToast(
            'warning',
            `Simulated Pothole Candidate (${newEvent.severity})`,
            `Synthetic anomaly detected on ${newEvent.roadSegmentName || 'Demo Corridor'} | Depth: ${newEvent.estimatedDepth}`
          );
        } else {
          // Persist to verified hardware storage
          const updated = StorageService.addVerifiedEvent(newEvent);
          setVerifiedEvents(updated);
          addToast(
            newEvent.severity === 'HIGH' ? 'danger' : 'warning',
            `Hardware Pothole Detected (${newEvent.severity})`,
            `ESP32 Reading #${reading.readingNumber ?? ''}: Distance ${reading.ultrasonicDistance.toFixed(1)} cm | Vibration ${reading.vibrationG ?? reading.vibration} g`
          );
        }
      }
    },
    [analysisState, addToast]
  );

  // 2. Hardware stream subscription
  useEffect(() => {
    if (operatingMode !== 'HARDWARE') return;

    const sensor = esp32ServiceRef.current;
    const unsubscribeData = sensor.subscribe((reading) => {
      handleIncomingReading(reading);
    });

    return () => {
      unsubscribeData();
    };
  }, [operatingMode, handleIncomingReading]);

  // 3. Simulation stream subscription
  useEffect(() => {
    if (operatingMode !== 'SIMULATION') return;

    const sensor = simulatedServiceRef.current;
    const unsubscribeData = sensor.subscribe((reading) => {
      handleIncomingReading(reading);
    });

    const unsubscribeSeq = sensor.subscribeSequence((seq) => {
      setSequenceState(seq);
    });

    return () => {
      unsubscribeData();
      unsubscribeSeq();
    };
  }, [operatingMode, handleIncomingReading]);

  // Launch Simulation Demo Mode
  const launchSimulationDemo = useCallback(() => {
    // If hardware was connected, suspend hardware stream
    if (esp32ServiceRef.current.isHardwareConnected()) {
      esp32ServiceRef.current.disconnect();
    }

    setOperatingMode('SIMULATION');
    setAnalysisState('RUNNING');
    detectionEngineRef.current.reset();
    setTelemetryHistory([]);

    simulatedServiceRef.current.reset();
    simulatedServiceRef.current.start();

    setDetectionResult({
      condition: 'NORMAL',
      confidence: 0,
      severity: null,
      reasons: ['Simulation Demo Active: Evaluating synthetic telemetry stream along demonstration route.'],
      distanceAnomalyContribution: 0,
      accelAnomalyContribution: 0,
      vibrationContribution: 0,
      isPotholeConfirmed: false,
    });

    addToast(
      'info',
      'Simulation Demo Active',
      'Running synthetic sensor telemetry along demo route. Real ESP32 is not required.'
    );
  }, [addToast]);

  // Exit Simulation Demo Mode
  const exitSimulationDemo = useCallback(() => {
    simulatedServiceRef.current.reset();
    setOperatingMode('STANDBY');
    setAnalysisState('IDLE');
    setCurrentReading(null);
    setTelemetryHistory([]);
    detectionEngineRef.current.reset();

    setDetectionResult({
      condition: 'STANDBY',
      confidence: null,
      severity: null,
      reasons: ['System in Standby. Select "Connect Hardware" or "Launch Simulation Demo" to begin.'],
      distanceAnomalyContribution: null,
      accelAnomalyContribution: null,
      vibrationContribution: null,
      isPotholeConfirmed: false,
    });

    addToast('info', 'Demo Stopped', 'Exited Simulation Demo. System returned to standby.');
  }, [addToast]);

  // Select Operating Mode explicitly
  const selectOperatingMode = useCallback(
    (mode: OperatingMode) => {
      if (mode === 'SIMULATION') {
        launchSimulationDemo();
      } else if (mode === 'HARDWARE') {
        simulatedServiceRef.current.reset();
        setOperatingMode('HARDWARE');
        setAnalysisState('IDLE');
        setCurrentReading(null);
        setTelemetryHistory([]);
        detectionEngineRef.current.reset();
        addToast('info', 'Hardware Mode Selected', 'Please connect your ESP32 MCU via WebSocket or USB Serial.');
      } else {
        exitSimulationDemo();
      }
    },
    [launchSimulationDemo, exitSimulationDemo, addToast]
  );

  // Connect to Physical ESP32 Hardware
  const connectHardware = async (
    type: HardwareConnectionType = 'WEBSOCKET',
    endpoint?: string
  ): Promise<boolean> => {
    // If simulation was running, stop it first
    if (operatingMode === 'SIMULATION') {
      simulatedServiceRef.current.reset();
    }

    setOperatingMode('HARDWARE');
    const targetEndpoint = endpoint || hardwareEndpoint;
    setHardwareError(null);

    if (type === 'SERIAL') {
      addToast('info', 'Connecting Hardware', 'Opening Web Serial port selector for ESP32 (115200 baud)...');
      const success = await esp32ServiceRef.current.connectSerial();
      if (success) {
        setAnalysisState('RUNNING');
        addToast('info', 'Port Opened', 'ESP32 COM port opened. Waiting for valid telemetry lines...');
      } else {
        addToast('danger', 'Connection Failed', 'Could not open serial connection to ESP32.');
      }
      return success;
    } else {
      addToast('info', 'Connecting Hardware', `Attempting WebSocket connection to ${targetEndpoint}...`);
      const success = await esp32ServiceRef.current.connectWebSocket(targetEndpoint);
      if (success) {
        setAnalysisState('RUNNING');
        addToast('success', 'Hardware Connected', `ESP32 connected via WebSocket at ${targetEndpoint}.`);
      } else {
        addToast('danger', 'Connection Failed', `Could not connect to ${targetEndpoint}. Ensure ESP32 is powered on.`);
      }
      return success;
    }
  };

  const disconnectHardware = async () => {
    await esp32ServiceRef.current.disconnect();
    setHardwareStatus('DISCONNECTED');
    setHardwareConnectionType(null);
    setAnalysisState('IDLE');
    addToast('info', 'Hardware Disconnected', 'ESP32 sensor bridge disconnected.');
  };

  // Start / Resume Analysis
  const startAnalysis = () => {
    if (operatingMode === 'STANDBY') {
      setIsConnectModalOpen(true);
      addToast('info', 'Select Operating Mode', 'Choose Hardware Mode or Simulation Demo Mode to begin analysis.');
      return;
    }

    if (operatingMode === 'HARDWARE' && hardwareStatus === 'DISCONNECTED') {
      setIsConnectModalOpen(true);
      addToast('warning', 'Hardware Disconnected', 'Connect physical ESP32 via USB Serial or WebSocket to begin analysis.');
      return;
    }

    setAnalysisState('RUNNING');

    if (operatingMode === 'SIMULATION') {
      simulatedServiceRef.current.start();
      addToast('success', 'Analysis Active', 'Evaluating synthetic telemetry stream along demo route.');
    } else {
      addToast('success', 'Analysis Active', 'Real-time sensor fusion is actively evaluating ESP32 telemetry.');
    }

    setDetectionResult({
      condition: 'NORMAL',
      confidence: 0,
      severity: null,
      reasons: ['Analysis Engine Active: Monitoring incoming telemetry frames.'],
      distanceAnomalyContribution: 0,
      accelAnomalyContribution: 0,
      vibrationContribution: 0,
      isPotholeConfirmed: false,
    });
  };

  // Pause / Stop Analysis
  const stopAnalysis = () => {
    setAnalysisState('PAUSED');

    if (operatingMode === 'SIMULATION') {
      simulatedServiceRef.current.pause();
    }

    setDetectionResult({
      condition: 'STANDBY',
      confidence: null,
      severity: null,
      reasons: ['Analysis paused. Click "Resume Analysis" to continue monitoring.'],
      distanceAnomalyContribution: null,
      accelAnomalyContribution: null,
      vibrationContribution: null,
      isPotholeConfirmed: false,
    });

    addToast('info', 'Analysis Paused', 'Sensor analysis has been paused.');
  };

  const toggleAnalysis = () => {
    if (isAnalyzing) {
      stopAnalysis();
    } else {
      startAnalysis();
    }
  };

  // Clear Demo Session only
  const clearDemoSession = () => {
    StorageService.clearDemoEvents();
    setDemoEvents([]);
    addToast('info', 'Demo Session Cleared', 'Simulated demo detections have been cleared. Verified hardware records remain intact.');
  };

  // Clear Verified Hardware Events
  const clearVerifiedEvents = () => {
    StorageService.clearVerifiedEvents();
    setVerifiedEvents([]);
    addToast('info', 'Verified Storage Cleared', 'Verified hardware detection records have been cleared.');
  };

  const clearAllEvents = () => {
    if (operatingMode === 'SIMULATION') {
      clearDemoSession();
    } else {
      clearVerifiedEvents();
    }
  };

  const updateEventStatus = (eventId: string, newStatus: PotholeStatus, notes?: string) => {
    if (operatingMode === 'SIMULATION') {
      const updated = demoEvents.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              status: newStatus,
              repairedAt: newStatus === 'REPAIRED' ? new Date().toISOString() : evt.repairedAt,
              notes: notes ?? evt.notes,
            }
          : evt
      );
      StorageService.saveDemoEvents(updated);
      setDemoEvents(updated);
    } else {
      const updated = StorageService.updateEventStatus(eventId, newStatus, notes);
      setVerifiedEvents(updated);
    }

    if (newStatus === 'REPAIRED') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      addToast('success', 'Status Updated: REPAIRED', 'Road Health Score recovered.');
    } else {
      addToast('info', 'Status Updated', `Event marked as ${newStatus}.`);
    }
  };

  const deleteEvent = (eventId: string) => {
    if (operatingMode === 'SIMULATION') {
      const updated = demoEvents.filter((e) => e.id !== eventId);
      StorageService.saveDemoEvents(updated);
      setDemoEvents(updated);
    } else {
      const updated = StorageService.deleteEvent(eventId);
      setVerifiedEvents(updated);
    }
    addToast('warning', 'Event Deleted', 'Record removed.');
  };

  const toggleBuzzer = () => {
    setBuzzerEnabled((prev) => !prev);
    addToast('info', 'Buzzer Subsystem', 'Physical ESP32 piezo buzzer hardware alert integration pending.');
  };

  // Trigger manual simulation scenario
  const triggerScenario = (scenario: 'normal' | 'rough' | 'small' | 'medium' | 'severe') => {
    if (operatingMode !== 'SIMULATION') {
      addToast('info', 'Enabling Demo Mode', 'Switching to Simulation Demo Mode to run scenario.');
      launchSimulationDemo();
    }
    simulatedServiceRef.current.triggerScenario(scenario);
  };

  return (
    <SystemContext.Provider
      value={{
        operatingMode,
        analysisState,
        isAnalyzing,
        isStreamRunning: isAnalyzing,
        isDemoMode: operatingMode === 'SIMULATION',
        currentReading,
        telemetryHistory,
        telemetrySource: operatingMode === 'SIMULATION' ? 'SIMULATION' : operatingMode === 'HARDWARE' ? 'HARDWARE' : 'NONE',
        detectionResult,
        roadHealth,
        sequenceState,
        ingestedPacketsCount,
        potholeEvents: activeEvents,
        verifiedEvents,
        demoEvents,
        lastDetectedEvent,
        quarantineNotice,
        hardwareStatus,
        hardwareConnectionType,
        hardwareEndpoint,
        hardwareError,
        sensorService: operatingMode === 'SIMULATION' ? simulatedServiceRef.current : esp32ServiceRef.current,
        buzzerEnabled,
        activeTab,
        toasts,
        isConnectModalOpen,
        setActiveTab,
        setIsConnectModalOpen,
        selectOperatingMode,
        launchSimulationDemo,
        exitSimulationDemo,
        connectHardware,
        disconnectHardware,
        setHardwareEndpoint,
        startAnalysis,
        stopAnalysis,
        toggleAnalysis,
        updateEventStatus,
        deleteEvent,
        clearAllEvents,
        clearDemoSession,
        clearVerifiedEvents,
        dismissQuarantineNotice,
        toggleBuzzer,
        dismissToast,
        triggerScenario,
        startSimulation: launchSimulationDemo,
        pauseSimulation: stopAnalysis,
        resetSimulation: exitSimulationDemo,
        startDemoMode: launchSimulationDemo,
        stopDemoMode: exitSimulationDemo,
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
