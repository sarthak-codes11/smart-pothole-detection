import { PotholeEvent, PotholeStatus } from '../types';

const STORAGE_KEY = 'SMART_ROAD_POTHOLE_EVENTS_V2';

/**
 * Realistic seed data positioned directly along the actual road network
 */
const SEED_POTHOLE_EVENTS: PotholeEvent[] = [
  {
    id: 'PTH-749102-101',
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
    latitude: 16.5065,
    longitude: 80.6330,
    severity: 'LOW',
    confidence: 76,
    estimatedDepth: '4.2 cm',
    impactLevel: 'Minor',
    ultrasonicDistance: 27.2,
    accelerationX: 0.42,
    accelerationY: 0.18,
    accelerationZ: 13.85,
    vibrationLevel: 58,
    vehicleSpeed: 36.2,
    status: 'VERIFIED',
    reasons: ['Minor ultrasonic depth anomaly (27.2 cm)', 'Vertical acceleration spike (13.85 m/s²)', 'Moderate vibration'],
    roadSegmentName: 'MG Road (Prakasam Road Junction)',
  },
  {
    id: 'PTH-882319-204',
    timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString(),
    latitude: 16.5042,
    longitude: 80.6415,
    severity: 'HIGH',
    confidence: 94,
    estimatedDepth: '14.6 cm',
    impactLevel: 'Severe',
    ultrasonicDistance: 47.6,
    accelerationX: 2.15,
    accelerationY: 1.40,
    accelerationZ: 21.30,
    vibrationLevel: 92,
    vehicleSpeed: 31.5,
    status: 'NEW',
    reasons: ['Severe ultrasonic depth drop (47.6 cm)', 'Critical vertical shock spike (21.30 m/s²)', 'Critical chassis vibration (92/100)'],
    roadSegmentName: 'MG Road (Siddhartha College)',
  },
  {
    id: 'PTH-319405-309',
    timestamp: new Date(Date.now() - 3600000 * 2.7).toISOString(),
    latitude: 16.5005,
    longitude: 80.6505,
    severity: 'MEDIUM',
    confidence: 84,
    estimatedDepth: '8.8 cm',
    impactLevel: 'Moderate',
    ultrasonicDistance: 35.8,
    accelerationX: 0.95,
    accelerationY: 0.62,
    accelerationZ: 16.90,
    vibrationLevel: 74,
    vehicleSpeed: 28.0,
    status: 'VERIFIED',
    reasons: ['Moderate ultrasonic depth drop (35.8 cm)', 'Moderate vertical acceleration spike (16.90 m/s²)', 'High vibration level'],
    roadSegmentName: 'Benz Circle Interchange',
  },
  {
    id: 'PTH-552910-412',
    timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
    latitude: 16.5060,
    longitude: 80.6545,
    severity: 'LOW',
    confidence: 72,
    estimatedDepth: '3.8 cm',
    impactLevel: 'Minor',
    ultrasonicDistance: 26.8,
    accelerationX: 0.35,
    accelerationY: 0.22,
    accelerationZ: 13.20,
    vibrationLevel: 62,
    vehicleSpeed: 40.1,
    status: 'REPAIRED',
    reasons: ['Minor surface irregularity (26.8 cm)', 'Suspension vibration jitter', 'Rough road vibration'],
    roadSegmentName: 'Ring Road (ITI College Link)',
    repairedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    notes: 'Bitumen patch applied by Municipal Works Dept.',
  },
  {
    id: 'PTH-667104-515',
    timestamp: new Date(Date.now() - 3600000 * 1.3).toISOString(),
    latitude: 16.5120,
    longitude: 80.6580,
    severity: 'HIGH',
    confidence: 96,
    estimatedDepth: '16.2 cm',
    impactLevel: 'Severe',
    ultrasonicDistance: 49.2,
    accelerationX: 3.10,
    accelerationY: 1.85,
    accelerationZ: 22.80,
    vibrationLevel: 95,
    vehicleSpeed: 33.4,
    status: 'NEW',
    reasons: ['Severe ultrasonic depth drop (49.2 cm)', 'Critical vertical shock spike (22.80 m/s²)', 'Critical chassis vibration (95/100)'],
    roadSegmentName: 'Loyola College Road',
  },
  {
    id: 'PTH-901452-618',
    timestamp: new Date(Date.now() - 3600000 * 0.9).toISOString(),
    latitude: 16.5250,
    longitude: 80.6665,
    severity: 'MEDIUM',
    confidence: 86,
    estimatedDepth: '9.4 cm',
    impactLevel: 'Moderate',
    ultrasonicDistance: 37.4,
    accelerationX: 1.20,
    accelerationY: 0.75,
    accelerationZ: 17.40,
    vibrationLevel: 78,
    vehicleSpeed: 30.2,
    status: 'NEW',
    reasons: ['Moderate ultrasonic depth drop (37.4 cm)', 'Moderate vertical acceleration spike', 'High vibration burst'],
    roadSegmentName: 'Ramavarappadu Ring (NH16)',
  },
  {
    id: 'PTH-114782-721',
    timestamp: new Date(Date.now() - 3600000 * 0.4).toISOString(),
    latitude: 16.5215,
    longitude: 80.6565,
    severity: 'LOW',
    confidence: 75,
    estimatedDepth: '4.5 cm',
    impactLevel: 'Minor',
    ultrasonicDistance: 27.5,
    accelerationX: 0.50,
    accelerationY: 0.30,
    accelerationZ: 14.10,
    vibrationLevel: 64,
    vehicleSpeed: 37.0,
    status: 'NEW',
    reasons: ['Minor ultrasonic depth anomaly (27.5 cm)', 'Vertical suspension jitter', 'Elevated vibration'],
    roadSegmentName: 'Karl Marx Road (Gunadala)',
  },
  {
    id: 'PTH-448903-825',
    timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(),
    latitude: 16.5185,
    longitude: 80.6480,
    severity: 'HIGH',
    confidence: 91,
    estimatedDepth: '13.0 cm',
    impactLevel: 'Severe',
    ultrasonicDistance: 45.0,
    accelerationX: 2.40,
    accelerationY: 1.10,
    accelerationZ: 20.40,
    vibrationLevel: 89,
    vehicleSpeed: 29.8,
    status: 'NEW',
    reasons: ['Severe ultrasonic depth anomaly (45.0 cm)', 'Vertical acceleration shock (20.40 m/s²)', 'High vibration burst (89/100)'],
    roadSegmentName: 'Karl Marx Road (Machavaram)',
  },
  {
    id: 'PTH-623891-929',
    timestamp: new Date(Date.now() - 3600000 * 0.1).toISOString(),
    latitude: 16.5160,
    longitude: 80.6405,
    severity: 'MEDIUM',
    confidence: 82,
    estimatedDepth: '7.6 cm',
    impactLevel: 'Moderate',
    ultrasonicDistance: 34.6,
    accelerationX: 0.85,
    accelerationY: 0.45,
    accelerationZ: 16.20,
    vibrationLevel: 71,
    vehicleSpeed: 34.5,
    status: 'NEW',
    reasons: ['Moderate ultrasonic depth drop (34.6 cm)', 'Vertical acceleration spike', 'Moderate chassis vibration'],
    roadSegmentName: 'Karl Marx Road (Seetharampuram)',
  }
];

export class StorageService {
  public static loadEvents(): PotholeEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveEvents(SEED_POTHOLE_EVENTS);
        return SEED_POTHOLE_EVENTS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      this.saveEvents(SEED_POTHOLE_EVENTS);
      return SEED_POTHOLE_EVENTS;
    } catch (e) {
      console.warn('[StorageService] Error loading from LocalStorage, falling back to seed data:', e);
      return SEED_POTHOLE_EVENTS;
    }
  }

  public static saveEvents(events: PotholeEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('[StorageService] Error saving events to LocalStorage:', e);
    }
  }

  public static addEvent(event: PotholeEvent): PotholeEvent[] {
    const current = this.loadEvents();
    const updated = [event, ...current];
    this.saveEvents(updated);
    return updated;
  }

  public static updateEventStatus(
    eventId: string,
    newStatus: PotholeStatus,
    notes?: string
  ): PotholeEvent[] {
    const current = this.loadEvents();
    const updated = current.map((item) => {
      if (item.id === eventId) {
        return {
          ...item,
          status: newStatus,
          repairedAt: newStatus === 'REPAIRED' ? new Date().toISOString() : item.repairedAt,
          notes: notes !== undefined ? notes : item.notes,
        };
      }
      return item;
    });
    this.saveEvents(updated);
    return updated;
  }

  public static deleteEvent(eventId: string): PotholeEvent[] {
    const current = this.loadEvents();
    const updated = current.filter((item) => item.id !== eventId);
    this.saveEvents(updated);
    return updated;
  }

  public static resetToSeed(): PotholeEvent[] {
    this.saveEvents(SEED_POTHOLE_EVENTS);
    return SEED_POTHOLE_EVENTS;
  }

  public static clearAll(): PotholeEvent[] {
    this.saveEvents([]);
    return [];
  }
}
