/**
 * Automated Free-Slot Detector for StudyMate
 * Scans the fixed college/school timetable across active days (8:00 AM – 10:00 PM)
 * and calculates every unoccupied time window between, before, and after classes.
 */

export class FreeSlotDetector {
  /**
   * Convert "HH:MM" (24h) to minutes from midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  /**
   * Convert minutes from midnight to "HH:MM" (24h)
   */
  static minutesToTime(minutes) {
    const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Convert minutes from midnight to 12-hour AM/PM string (e.g. "11:15 AM")
   */
  static minutesTo12Hour(minutes) {
    const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
    let h = Math.floor(norm / 60);
    const m = norm % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  /**
   * Format duration in minutes into a human-friendly label (e.g. "45m", "1.5h", "2h")
   */
  static formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = minutes / 60;
    if (Number.isInteger(hours)) return `${hours}h`;
    return `${hours.toFixed(1)}h`;
  }

  /**
   * Detects all unoccupied time windows in the 8:00 AM – 10:00 PM grid
   * @param {Array<Object>} classes - Array of fixed class slots with { day, startTime, endTime, isLocked }
   * @param {Object} [options]
   * @param {string} [options.dayStart='08:00'] - Grid start time (default: 8:00 AM)
   * @param {string} [options.dayEnd='22:00'] - Grid end time (default: 10:00 PM)
   * @param {Array<string>} [options.activeDays=['Mon', 'Tue', 'Wed', 'Thu', 'Fri']]
   * @param {number} [options.minDurationMinutes=15] - Filter out negligible gaps smaller than 15 mins
   * @returns {Array<Object>} List of detected free slots
   */
  static detectFreeSlots(classes = [], options = {}) {
    const dayStartStr = options.dayStart || '08:00';
    const dayEndStr = options.dayEnd || '22:00';
    const activeDays = options.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const minDuration = options.minDurationMinutes ?? 15;

    const gridStartMin = FreeSlotDetector.timeToMinutes(dayStartStr);
    const gridEndMin = FreeSlotDetector.timeToMinutes(dayEndStr);

    const freeSlots = [];

    for (const day of activeDays) {
      // 1. Filter and normalize all classes for this day
      const dayClasses = classes
        .filter(c => c.day === day)
        .map(c => ({
          title: c.title,
          start: FreeSlotDetector.timeToMinutes(c.startTime),
          end: FreeSlotDetector.timeToMinutes(c.endTime)
        }))
        // Clamp to grid boundaries
        .map(c => ({
          ...c,
          start: Math.max(gridStartMin, c.start),
          end: Math.min(gridEndMin, c.end)
        }))
        .filter(c => c.start < c.end)
        .sort((a, b) => a.start - b.start);

      // 2. Merge overlapping or touching class intervals
      const mergedClasses = [];
      for (const cls of dayClasses) {
        if (!mergedClasses.length) {
          mergedClasses.push({ start: cls.start, end: cls.end });
        } else {
          const last = mergedClasses[mergedClasses.length - 1];
          if (cls.start <= last.end) {
            last.end = Math.max(last.end, cls.end);
          } else {
            mergedClasses.push({ start: cls.start, end: cls.end });
          }
        }
      }

      // 3. Identify unoccupied intervals between gridStartMin and gridEndMin
      let cur = gridStartMin;

      for (const cls of mergedClasses) {
        if (cls.start > cur) {
          const duration = cls.start - cur;
          if (duration >= minDuration) {
            freeSlots.push(FreeSlotDetector._createFreeSlotObject(day, cur, cls.start, duration));
          }
        }
        cur = Math.max(cur, cls.end);
      }

      // Final gap after the last class until gridEndMin (10:00 PM)
      if (cur < gridEndMin) {
        const duration = gridEndMin - cur;
        if (duration >= minDuration) {
          freeSlots.push(FreeSlotDetector._createFreeSlotObject(day, cur, gridEndMin, duration));
        }
      }
    }

    return freeSlots;
  }

  static _createFreeSlotObject(day, startMin, endMin, durationMinutes) {
    const startTime24 = FreeSlotDetector.minutesToTime(startMin);
    const endTime24 = FreeSlotDetector.minutesToTime(endMin);
    const start12 = FreeSlotDetector.minutesTo12Hour(startMin);
    const end12 = FreeSlotDetector.minutesTo12Hour(endMin);
    const durationLabel = FreeSlotDetector.formatDuration(durationMinutes);

    return {
      id: `free_${day}_${startMin}_${endMin}`,
      day,
      startTime: startTime24,
      endTime: endTime24,
      startMinutes: startMin,
      endMinutes: endMin,
      durationMinutes,
      durationLabel,
      label: `${day} ${start12} - ${end12} [${durationLabel} free]`
    };
  }
}
