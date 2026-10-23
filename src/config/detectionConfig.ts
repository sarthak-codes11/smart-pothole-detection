/**
 * Detection & Sensor Fusion Configuration
 * Centralized thresholds, physical baselines, and realistic street route waypoints.
 */
export const DETECTION_CONFIG = {
  // Baseline Sensor Physical Reference Values
  baselines: {
    ultrasonicDistanceCm: 21.0, // Ground clearance to nominal road surface
    accelZNominal: 9.81,        // Earth gravity (m/s^2)
    accelXNominal: 0.0,
    accelYNominal: 0.0,
    vibrationNominal: 12.0,     // Smooth asphalt baseline vibration
    vehicleSpeedNominal: 34.0,  // Average city patrol speed km/h
  },

  // Sensor Fusion Component Weights (Sum = 100%)
  weights: {
    distanceAnomalyWeight: 0.40,  // 40% contribution
    accelerationSpikeWeight: 0.40, // 40% contribution
    vibrationSpikeWeight: 0.20,   // 20% contribution
  },

  // Ultrasonic Distance Anomaly Thresholds (cm)
  ultrasonicThresholds: {
    normalMax: 25.0,
    minorIrregularityMin: 25.0,
    minorIrregularityMax: 30.0,
    mediumPotholeMin: 30.0,
    mediumPotholeMax: 40.0,
    severePotholeMin: 40.0,
    maxDetectable: 65.0,
  },

  // Vertical Acceleration (Z-axis) Delta Thresholds (|z - 9.81| in m/s^2)
  accelerationThresholds: {
    normalDeltaMax: 2.0,        // e.g. 7.8 - 11.8 m/s^2
    minorSpikeDelta: 4.0,       // e.g. delta >= 4 m/s^2
    mediumSpikeDelta: 7.0,      // e.g. delta >= 7 m/s^2
    severeSpikeDelta: 10.0,     // e.g. delta >= 10 m/s^2 (impact spike > 19.8 or < 0)
  },

  // Vibration Intensity Thresholds (0 - 100 scale)
  vibrationThresholds: {
    normalMax: 25.0,
    roughRoadMin: 26.0,
    roughRoadMax: 55.0,
    potholeTriggerMin: 60.0,
    severeTriggerMin: 80.0,
  },

  // Detection Confidence Thresholds (0 - 100%)
  confidenceThresholds: {
    possibleIrregularityMin: 45.0,
    potholeConfirmedMin: 70.0,
  },

  // Severity Classification Bounds
  severityBounds: {
    lowMaxConfidence: 79.9,
    mediumMaxConfidence: 89.9,
    highMinConfidence: 90.0,
  },

  // Road Health Scoring Constants
  roadHealth: {
    initialScore: 100,
    penaltyLowSeverity: 4.0,
    penaltyMediumSeverity: 9.0,
    penaltyHighSeverity: 16.0,
    repairedRecoveryBonus: 3.5,
    goodRatingMin: 90,
    moderateRatingMin: 70,
  },

  // Realistic Urban Street Circuit Route (follows actual MG Road, Ring Road, and Karl Marx Road)
  routeWaypoints: [
    { lat: 16.5080, lng: 80.6260, name: "Governorpet Main Road" },
    { lat: 16.5065, lng: 80.6330, name: "MG Road (Prakasam Road Junction)" },
    { lat: 16.5042, lng: 80.6415, name: "MG Road (Siddhartha College)" },
    { lat: 16.5020, lng: 80.6470, name: "MG Road (DV Manor Corridor)" },
    { lat: 16.5005, lng: 80.6505, name: "Benz Circle Interchange" },
    { lat: 16.5060, lng: 80.6545, name: "Ring Road (ITI College Link)" },
    { lat: 16.5120, lng: 80.6580, name: "Loyola College Road" },
    { lat: 16.5180, lng: 80.6625, name: "Mahanadu Road Link" },
    { lat: 16.5250, lng: 80.6665, name: "Ramavarappadu Ring (NH16)" },
    { lat: 16.5215, lng: 80.6565, name: "Karl Marx Road (Gunadala)" },
    { lat: 16.5185, lng: 80.6480, name: "Karl Marx Road (Machavaram)" },
    { lat: 16.5160, lng: 80.6405, name: "Karl Marx Road (Seetharampuram)" },
    { lat: 16.5135, lng: 80.6330, name: "Karl Marx Road (Besant Road)" },
    { lat: 16.5110, lng: 80.6275, name: "Gandhi Nagar Station Road" },
  ]
};
