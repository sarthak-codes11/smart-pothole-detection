import { PotholeEvent, RoadHealthMetrics } from '../types';
import { DETECTION_CONFIG } from '../config/detectionConfig';

export class RoadHealthEngine {
  /**
   * Calculate dynamic road health metrics based on active and historical pothole events.
   */
  public static calculateMetrics(events: PotholeEvent[]): RoadHealthMetrics {
    const totalPotholes = events.length;
    if (totalPotholes === 0) {
      return {
        score: null,
        rating: 'UNAVAILABLE',
        totalPotholes: 0,
        highSeverityCount: 0,
        mediumSeverityCount: 0,
        lowSeverityCount: 0,
        eventsTodayCount: 0,
        mostAffectedSegment: 'No observations recorded',
        activePotholesCount: 0,
        repairedCount: 0,
        isAvailable: false,
      };
    }

    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    let repairedCount = 0;
    let activePotholesCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    let eventsTodayCount = 0;

    const segmentDetections: Record<string, number> = {};

    for (const event of events) {
      if (event.timestamp.startsWith(todayStr)) {
        eventsTodayCount++;
      }

      if (event.status === 'REPAIRED') {
        repairedCount++;
      } else {
        activePotholesCount++;
      }

      if (event.severity === 'HIGH') highCount++;
      else if (event.severity === 'MEDIUM') medCount++;
      else lowCount++;

      const seg = event.roadSegmentName || 'Main Corridor';
      segmentDetections[seg] = (segmentDetections[seg] || 0) + (event.status === 'REPAIRED' ? 0.3 : 1);
    }

    // Determine most affected road segment
    let mostAffectedSegment = 'Route In Good Standing';
    let maxSegmentWeight = 0;
    for (const [seg, weight] of Object.entries(segmentDetections)) {
      if (weight > maxSegmentWeight) {
        maxSegmentWeight = weight;
        mostAffectedSegment = seg;
      }
    }

    // Calculate Road Health Score starting from 100
    // Active high severity reduces by penaltyHighSeverity (16)
    // Active medium severity reduces by penaltyMediumSeverity (9)
    // Active low severity reduces by penaltyLowSeverity (4)
    // Repaired potholes restore health bonus
    const cfg = DETECTION_CONFIG.roadHealth;
    let score = cfg.initialScore;

    for (const event of events) {
      if (event.status === 'REPAIRED') {
        // Minor residual penalty for repaired patches
        score -= (event.severity === 'HIGH' ? 2 : event.severity === 'MEDIUM' ? 1 : 0.5);
      } else {
        if (event.severity === 'HIGH') score -= cfg.penaltyHighSeverity;
        else if (event.severity === 'MEDIUM') score -= cfg.penaltyMediumSeverity;
        else score -= cfg.penaltyLowSeverity;
      }
    }

    // Clamp score between 12 and 100
    const clampedScore = Math.max(12, Math.min(100, Math.round(score)));

    let rating: 'GOOD' | 'MODERATE' | 'POOR' = 'GOOD';
    if (clampedScore < cfg.moderateRatingMin) {
      rating = 'POOR';
    } else if (clampedScore < cfg.goodRatingMin) {
      rating = 'MODERATE';
    }

    return {
      score: clampedScore,
      rating,
      totalPotholes,
      highSeverityCount: highCount,
      mediumSeverityCount: medCount,
      lowSeverityCount: lowCount,
      eventsTodayCount,
      mostAffectedSegment,
      activePotholesCount,
      repairedCount,
    };
  }
}
