import { SensorReading, DetectionResult, PotholeSeverity, PotholeEvent, PotholeStatus, DetectionCondition } from '../types';
import { DETECTION_CONFIG } from '../config/detectionConfig';

export class DetectionEngine {
  // Rolling Window History Buffers for anomaly comparison
  private distanceBuffer: number[] = [];
  private accelZBuffer: number[] = [];
  private readonly bufferMaxSize: number = 10;

  // Debouncing / Cooldown to avoid registering duplicate events for the same reading line
  private lastConfirmedPotholeTime: number = 0;
  private readonly detectionCooldownMs: number = 2400;

  /**
   * Reset rolling buffers
   */
  public reset(): void {
    this.distanceBuffer = [];
    this.accelZBuffer = [];
    this.lastConfirmedPotholeTime = 0;
  }

  /**
   * Evaluate a sensor telemetry packet:
   * 1. If reading comes from ESP32 hardware with authoritative statusText (NORMAL vs POTHOLE DETECTED),
   *    we respect that status directly without overriding it.
   * 2. Otherwise (simulation or raw sensor stream), we evaluate using the multi-sensor fusion matrix.
   */
  public evaluate(reading: SensorReading): {
    result: DetectionResult;
    newEvent: PotholeEvent | null;
  } {
    // --- SPECIAL HANDLING: Authoritative ESP32 Firmware Status ---
    if (reading.source === 'HARDWARE' && reading.statusText) {
      const isPothole = reading.statusText === 'POTHOLE DETECTED';
      const condition: DetectionCondition = isPothole ? 'POTHOLE DETECTED' : 'NORMAL';
      const readingNumStr = reading.readingNumber != null ? `#${reading.readingNumber}` : '';

      const reasons: string[] = isPothole
        ? [
            `Hardware Status: POTHOLE DETECTED (${reading.isPlayback ? 'ESP32 Playback ' + readingNumStr : 'Physical Sensor'})`,
            `Reported Distance: ${reading.ultrasonicDistance.toFixed(1)} cm`,
            `Reported Vibration: ${reading.vibrationG ?? reading.vibration} g`,
          ]
        : [
            `Hardware Status: NORMAL (Normal Road ${readingNumStr})`,
            `Reported Distance: ${reading.ultrasonicDistance.toFixed(1)} cm`,
            `Reported Vibration: ${reading.vibrationG ?? reading.vibration} g`,
          ];

      const confidence = isPothole ? 95 : 0;
      const severity: PotholeSeverity | null = isPothole
        ? ((reading.vibrationG && reading.vibrationG >= 1.5) || reading.ultrasonicDistance >= 35 ? 'HIGH' : 'MEDIUM')
        : null;

      const result: DetectionResult = {
        condition,
        confidence,
        severity,
        reasons,
        distanceAnomalyContribution: isPothole ? 40 : 0,
        accelAnomalyContribution: isPothole ? 40 : 0,
        vibrationContribution: isPothole ? 20 : 0,
        isPotholeConfirmed: isPothole,
      };

      let newEvent: PotholeEvent | null = null;
      const now = Date.now();
      // Debounce duplicate events from same serial chunk
      if (isPothole && (now - this.lastConfirmedPotholeTime > this.detectionCooldownMs)) {
        this.lastConfirmedPotholeTime = now;
        newEvent = this.buildPotholeEvent(reading, severity || 'MEDIUM', confidence, reasons);
      }

      return { result, newEvent };
    }

    // --- STANDARD MULTI-SENSOR FUSION EVALUATION (Simulation / Live Raw Stream) ---
    this.distanceBuffer.push(reading.ultrasonicDistance);
    if (this.distanceBuffer.length > this.bufferMaxSize) {
      this.distanceBuffer.shift();
    }

    const accelZVal = reading.acceleration?.z ?? DETECTION_CONFIG.baselines.accelZNominal;
    this.accelZBuffer.push(accelZVal);
    if (this.accelZBuffer.length > this.bufferMaxSize) {
      this.accelZBuffer.shift();
    }

    // Calculate rolling baselines
    const baselineDistance = this.distanceBuffer.length > 2
      ? this.distanceBuffer.slice(0, -1).reduce((a, b) => a + b, 0) / (this.distanceBuffer.length - 1)
      : DETECTION_CONFIG.baselines.ultrasonicDistanceCm;

    const baselineAccelZ = DETECTION_CONFIG.baselines.accelZNominal;

    const reasons: string[] = [];

    // --- CONDITION A: Ultrasonic Distance Anomaly (40% Weight) ---
    const distanceDelta = reading.ultrasonicDistance - baselineDistance;
    let distanceContribution = 0;

    if (reading.ultrasonicDistance > DETECTION_CONFIG.ultrasonicThresholds.severePotholeMin) {
      distanceContribution = 40.0;
      reasons.push(`Severe ultrasonic depth anomaly (${reading.ultrasonicDistance.toFixed(1)} cm, +${distanceDelta.toFixed(1)} cm drop)`);
    } else if (reading.ultrasonicDistance > DETECTION_CONFIG.ultrasonicThresholds.mediumPotholeMin) {
      const ratio = (reading.ultrasonicDistance - DETECTION_CONFIG.ultrasonicThresholds.mediumPotholeMin) / 10.0;
      distanceContribution = 28.0 + (ratio * 10.0);
      reasons.push(`Moderate ultrasonic depth drop (${reading.ultrasonicDistance.toFixed(1)} cm)`);
    } else if (reading.ultrasonicDistance > DETECTION_CONFIG.ultrasonicThresholds.minorIrregularityMin) {
      const ratio = (reading.ultrasonicDistance - DETECTION_CONFIG.ultrasonicThresholds.minorIrregularityMin) / 5.0;
      distanceContribution = 15.0 + (ratio * 12.0);
      reasons.push(`Minor surface irregularity (${reading.ultrasonicDistance.toFixed(1)} cm)`);
    } else {
      distanceContribution = Math.max(0, (distanceDelta / 4.0) * 10.0);
    }
    distanceContribution = Math.min(40.0, Math.max(0, distanceContribution));

    // --- CONDITION B: Accelerometer Vertical Spike (40% Weight) ---
    const accelDelta = Math.abs(accelZVal - baselineAccelZ);
    let accelContribution = 0;

    if (accelDelta >= DETECTION_CONFIG.accelerationThresholds.severeSpikeDelta) {
      accelContribution = 40.0;
      reasons.push(`Severe vertical acceleration shock spike (${accelZVal.toFixed(2)} m/s², Δ${accelDelta.toFixed(2)})`);
    } else if (accelDelta >= DETECTION_CONFIG.accelerationThresholds.mediumSpikeDelta) {
      const ratio = (accelDelta - DETECTION_CONFIG.accelerationThresholds.mediumSpikeDelta) / 3.0;
      accelContribution = 28.0 + (ratio * 10.0);
      reasons.push(`Moderate vertical acceleration spike (${accelZVal.toFixed(2)} m/s²)`);
    } else if (accelDelta >= DETECTION_CONFIG.accelerationThresholds.minorSpikeDelta) {
      const ratio = (accelDelta - DETECTION_CONFIG.accelerationThresholds.minorSpikeDelta) / 3.0;
      accelContribution = 15.0 + (ratio * 12.0);
      reasons.push(`Vertical suspension vibration jitter (Δ${accelDelta.toFixed(2)} m/s²)`);
    } else {
      accelContribution = Math.max(0, (accelDelta / 2.0) * 8.0);
    }
    accelContribution = Math.min(40.0, Math.max(0, accelContribution));

    // --- CONDITION C: Vibration Intensity Threshold (20% Weight) ---
    let vibrationContribution = 0;
    if (reading.vibration >= DETECTION_CONFIG.vibrationThresholds.severeTriggerMin) {
      vibrationContribution = 20.0;
      reasons.push(`Critical chassis vibration burst (${reading.vibration}/100)`);
    } else if (reading.vibration >= DETECTION_CONFIG.vibrationThresholds.potholeTriggerMin) {
      const ratio = (reading.vibration - DETECTION_CONFIG.vibrationThresholds.potholeTriggerMin) / 20.0;
      vibrationContribution = 14.0 + (ratio * 5.0);
      reasons.push(`High vibration level (${reading.vibration}/100)`);
    } else if (reading.vibration >= DETECTION_CONFIG.vibrationThresholds.roughRoadMin) {
      const ratio = (reading.vibration - DETECTION_CONFIG.vibrationThresholds.roughRoadMin) / 30.0;
      vibrationContribution = 7.0 + (ratio * 6.0);
      reasons.push(`Rough road surface vibration (${reading.vibration}/100)`);
    } else {
      vibrationContribution = Math.max(0, (reading.vibration / 25.0) * 5.0);
    }
    vibrationContribution = Math.min(20.0, Math.max(0, vibrationContribution));

    // --- TOTAL CONFIDENCE FUSION ---
    const totalConfidence = Math.min(100, Math.round(distanceContribution + accelContribution + vibrationContribution));

    let condition: DetectionResult['condition'] = 'NORMAL';
    let isPotholeConfirmed = false;
    let severity: PotholeSeverity | null = null;

    if (totalConfidence >= DETECTION_CONFIG.confidenceThresholds.potholeConfirmedMin) {
      condition = 'POTHOLE DETECTED';
      isPotholeConfirmed = true;
      severity = this.classifySeverity(totalConfidence, reading.ultrasonicDistance, accelDelta, reading.vibration);
    } else if (totalConfidence >= DETECTION_CONFIG.confidenceThresholds.possibleIrregularityMin) {
      condition = 'POSSIBLE IRREGULARITY';
    } else {
      condition = 'NORMAL';
      if (reasons.length === 0) {
        reasons.push('Road surface uniform within normal operating tolerance');
      }
    }

    const result: DetectionResult = {
      condition,
      confidence: totalConfidence,
      severity,
      reasons,
      distanceAnomalyContribution: Math.round(distanceContribution),
      accelAnomalyContribution: Math.round(accelContribution),
      vibrationContribution: Math.round(vibrationContribution),
      isPotholeConfirmed,
    };

    // Create a new confirmed event if criteria met and cooldown elapsed
    let newEvent: PotholeEvent | null = null;
    const now = Date.now();
    if (isPotholeConfirmed && severity !== null && (now - this.lastConfirmedPotholeTime > this.detectionCooldownMs)) {
      this.lastConfirmedPotholeTime = now;
      newEvent = this.buildPotholeEvent(reading, severity, totalConfidence, reasons);
    }

    return { result, newEvent };
  }

  /**
   * Determine severity: LOW, MEDIUM, or HIGH based on fusion confidence & physical readings.
   */
  private classifySeverity(
    confidence: number,
    distance: number,
    accelDelta: number,
    vibration: number
  ): PotholeSeverity {
    if (confidence >= DETECTION_CONFIG.severityBounds.highMinConfidence || distance >= 42.0 || accelDelta >= 9.0 || vibration >= 80) {
      return 'HIGH';
    }
    if (confidence >= DETECTION_CONFIG.confidenceThresholds.potholeConfirmedMin + 10 || distance >= 30.0 || accelDelta >= 6.0 || vibration >= 55) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Package a confirmed detection event into a persistent record.
   */
  private buildPotholeEvent(
    reading: SensorReading,
    severity: PotholeSeverity,
    confidence: number,
    reasons: string[]
  ): PotholeEvent {
    const rawDepth = Math.max(2.5, reading.ultrasonicDistance - DETECTION_CONFIG.baselines.ultrasonicDistanceCm);
    const depthStr = `${rawDepth.toFixed(1)} cm`;

    const impactLevel: 'Minor' | 'Moderate' | 'Severe' =
      severity === 'HIGH' ? 'Severe' : severity === 'MEDIUM' ? 'Moderate' : 'Minor';

    const isSimulated = reading.source === 'SIMULATION';
    const idPrefix = isSimulated ? 'SIM' : (reading.isPlayback ? 'HW-PB' : 'PTH');

    const nearestSegment = isSimulated && reading.gps?.latitude && reading.gps?.longitude
      ? this.getNearestSegmentName(reading.gps.latitude, reading.gps.longitude)
      : (reading.isPlayback ? `ESP32 Playback Sample #${reading.readingNumber ?? ''}` : 'Physical Inspection Corridor');

    return {
      id: `${idPrefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: reading.timestamp,
      source: reading.source || 'HARDWARE',
      isSimulated,
      isPlayback: reading.isPlayback,
      readingNumber: reading.readingNumber,
      latitude: reading.gps?.latitude ?? 0,
      longitude: reading.gps?.longitude ?? 0,
      severity,
      confidence,
      estimatedDepth: depthStr,
      impactLevel,
      ultrasonicDistance: reading.ultrasonicDistance,
      accelerationX: reading.acceleration?.x ?? 0,
      accelerationY: reading.acceleration?.y ?? 0,
      accelerationZ: reading.acceleration?.z ?? 9.81,
      vibrationLevel: reading.vibration,
      vibrationG: reading.vibrationG,
      vehicleSpeed: reading.gps?.speed ?? 0,
      status: 'NEW' as PotholeStatus,
      reasons: isSimulated ? ['[SIMULATION] ' + reasons[0], ...reasons.slice(1)] : reasons,
      roadSegmentName: nearestSegment,
      notes: isSimulated
        ? 'Simulated pothole candidate (Synthetic Demo Session)'
        : (reading.isPlayback ? `Hardware-reported pothole detection (ESP32 recorded reading #${reading.readingNumber})` : 'Physical ESP32 hardware detection'),
    };
  }

  private getNearestSegmentName(lat: number, lng: number): string {
    let bestDist = Infinity;
    let bestName = "Sector 1 Corridor";
    for (const wp of DETECTION_CONFIG.routeWaypoints) {
      const d = Math.hypot(wp.lat - lat, wp.lng - lng);
      if (d < bestDist) {
        bestDist = d;
        bestName = wp.name;
      }
    }
    return bestName;
  }
}
