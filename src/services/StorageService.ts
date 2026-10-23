import { PotholeEvent, PotholeStatus } from '../types';

const LEGACY_STORAGE_KEY = 'SMART_ROAD_POTHOLE_EVENTS_V2';
const VERIFIED_STORAGE_KEY = 'SMART_ROAD_VERIFIED_EVENTS_V1';
const DEMO_STORAGE_KEY = 'SMART_ROAD_DEMO_EVENTS_SESSION_V1';
const QUARANTINE_STORAGE_KEY = 'SMART_ROAD_QUARANTINED_DEMO_RECORDS';
const QUARANTINE_NOTICE_KEY = 'SMART_ROAD_QUARANTINE_NOTICE';

export class StorageService {
  /**
   * Safely isolates legacy unverified demo records so they are never presented as genuine detections.
   */
  private static migrateAndQuarantineLegacyRecords(): void {
    try {
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData) {
        localStorage.setItem(QUARANTINE_STORAGE_KEY, legacyData);
        localStorage.setItem(
          QUARANTINE_NOTICE_KEY,
          'Notice: Legacy demo records from prior sessions were quarantined to ensure data integrity. Verified detection history is empty.'
        );
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[StorageService] Error during legacy record migration:', e);
    }
  }

  /**
   * Load verified genuine detection events.
   * A first-time visit or clean session returns an empty array.
   */
  public static loadVerifiedEvents(): PotholeEvent[] {
    try {
      this.migrateAndQuarantineLegacyRecords();
      const data = localStorage.getItem(VERIFIED_STORAGE_KEY);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((e) => ({ ...e, source: 'HARDWARE' as const }));
      }
      return [];
    } catch (e) {
      console.warn('[StorageService] Error loading verified events:', e);
      return [];
    }
  }

  public static saveVerifiedEvents(events: PotholeEvent[]): void {
    try {
      localStorage.setItem(VERIFIED_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('[StorageService] Error saving verified events:', e);
    }
  }

  public static addVerifiedEvent(event: PotholeEvent): PotholeEvent[] {
    const verifiedEvent: PotholeEvent = {
      ...event,
      source: 'HARDWARE',
      isSimulated: false,
    };
    const current = this.loadVerifiedEvents();
    const updated = [verifiedEvent, ...current];
    this.saveVerifiedEvents(updated);
    return updated;
  }

  public static clearVerifiedEvents(): PotholeEvent[] {
    this.saveVerifiedEvents([]);
    return [];
  }

  /**
   * Load current demo session simulated detection events.
   */
  public static loadDemoEvents(): PotholeEvent[] {
    try {
      const data = localStorage.getItem(DEMO_STORAGE_KEY);
      if (!data) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((e) => ({ ...e, source: 'SIMULATION' as const, isSimulated: true }));
      }
      return [];
    } catch (e) {
      console.warn('[StorageService] Error loading demo events:', e);
      return [];
    }
  }

  public static saveDemoEvents(events: PotholeEvent[]): void {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('[StorageService] Error saving demo events:', e);
    }
  }

  public static addDemoEvent(event: PotholeEvent): PotholeEvent[] {
    const demoEvent: PotholeEvent = {
      ...event,
      source: 'SIMULATION',
      isSimulated: true,
      notes: event.notes || 'Simulated pothole candidate (Demo Session)',
    };
    const current = this.loadDemoEvents();
    const updated = [demoEvent, ...current];
    this.saveDemoEvents(updated);
    return updated;
  }

  public static clearDemoEvents(): PotholeEvent[] {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (e) {
      console.error('[StorageService] Error clearing demo events:', e);
    }
    return [];
  }

  /**
   * General event loading (defaulting to verified hardware events)
   */
  public static loadEvents(source: 'HARDWARE' | 'SIMULATION' = 'HARDWARE'): PotholeEvent[] {
    return source === 'SIMULATION' ? this.loadDemoEvents() : this.loadVerifiedEvents();
  }

  public static saveEvents(events: PotholeEvent[], source: 'HARDWARE' | 'SIMULATION' = 'HARDWARE'): void {
    if (source === 'SIMULATION') {
      this.saveDemoEvents(events);
    } else {
      this.saveVerifiedEvents(events);
    }
  }

  public static addEvent(event: PotholeEvent): PotholeEvent[] {
    if (event.source === 'SIMULATION') {
      return this.addDemoEvent(event);
    }
    return this.addVerifiedEvent(event);
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

  public static clearAll(): PotholeEvent[] {
    this.saveEvents([]);
    return [];
  }

  public static getQuarantineNotice(): string | null {
    try {
      return localStorage.getItem(QUARANTINE_NOTICE_KEY);
    } catch {
      return null;
    }
  }

  public static dismissQuarantineNotice(): void {
    try {
      localStorage.removeItem(QUARANTINE_NOTICE_KEY);
    } catch {
      // ignore
    }
  }
}
