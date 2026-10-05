/**
 * Dynamic Cascade Engine ("Domino" Auto-Shift) for StudyMate Next-Gen
 * Enables single-click "Running 30m Late" cascade rescheduling.
 * Guarantees:
 * 1. Fixed/locked calendar events (classes, exams, appointments) remain completely immovable.
 * 2. Unlocked downstream tasks domino forward into free slots, jumping over locked blocks.
 * 3. Prevents overlaps and respects sleep/wake boundaries.
 */

import { Scheduler } from './scheduler.js';

export class DominoCascadeEngine {
  /**
   * Performs an automated cascade delay shift
   * @param {Object} params
   * @param {Array<Object>} params.slots - All current scheduled blocks
   * @param {number} params.delayMinutes - Minutes of delay (e.g., 30)
   * @param {string} params.dateStr - Date being shifted (e.g., '2026-10-05')
   * @param {number} [params.pivotMinutes] - Time when delay occurs (minutes from midnight). Defaults to current time.
   * @param {Object} [params.userProfile] - User constraints (sleepTime, wakeTime)
   * @returns {Object} { updatedSlots, shiftedCount, overflowTasks }
   */
  static dominoShift({
    slots = [],
    delayMinutes = 30,
    dateStr,
    pivotMinutes = null,
    userProfile = {}
  }) {
    if (!delayMinutes || delayMinutes <= 0) {
      return { updatedSlots: [...slots], shiftedCount: 0, overflowTasks: [] };
    }

    const sleepLimit = Scheduler.timeToMinutes(userProfile.sleepTime || '23:30');
    const wakeTime = Scheduler.timeToMinutes(userProfile.wakeTime || '07:00');

    // Default pivot to first slot after current time or first slot on that day
    let pivot = pivotMinutes;
    if (pivot === null) {
      const now = new Date();
      pivot = now.getHours() * 60 + now.getMinutes();
    }

    // Separate slots of other dates (unchanged) from target date
    const targetDateSlots = slots.filter(s => s.date === dateStr);
    const otherDateSlots = slots.filter(s => s.date !== dateStr);

    // Identify locked slots and unlocked slots
    const lockedSlots = targetDateSlots
      .filter(s => s.isLocked)
      .map(s => ({
        ...s,
        startMinutes: s.startMinutes ?? Scheduler.timeToMinutes(s.startTime),
        endMinutes: s.endMinutes ?? Scheduler.timeToMinutes(s.endTime)
      }))
      .sort((a, b) => a.startMinutes - b.startMinutes);

    // Unlocked slots that occur before pivot remain untouched
    const untouchedSlots = targetDateSlots.filter(s => {
      if (s.isLocked) return false;
      const start = s.startMinutes ?? Scheduler.timeToMinutes(s.startTime);
      return start < pivot;
    });

    // Unlocked slots at or after pivot that need to cascade
    const slotsToCascade = targetDateSlots.filter(s => {
      if (s.isLocked) return false;
      const start = s.startMinutes ?? Scheduler.timeToMinutes(s.startTime);
      return start >= pivot;
    }).sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0));

    const finalDaySlots = [...lockedSlots, ...untouchedSlots];
    let shiftedCount = 0;
    const overflowTasks = [];

    // Helper: is interval [start, end] free of collisions with finalDaySlots?
    const isIntervalFree = (start, end) => {
      for (const s of finalDaySlots) {
        // Check collision
        if (Math.max(start, s.startMinutes) < Math.min(end, s.endMinutes)) {
          return false;
        }
      }
      return true;
    };

    // Helper: find next free slot for duration, starting from searchMin
    const findNextAvailable = (searchMin, duration) => {
      let cur = Math.max(searchMin, wakeTime);
      // Snap to 5 or 15 minute interval
      cur = Math.ceil(cur / 5) * 5;

      while (cur + duration <= sleepLimit) {
        if (isIntervalFree(cur, cur + duration)) {
          return cur;
        }
        // If conflict exists with any slot, jump cur to the end of that colliding slot
        const colliding = finalDaySlots.find(s => Math.max(cur, s.startMinutes) < Math.min(cur + duration, s.endMinutes));
        if (colliding) {
          cur = Math.ceil(colliding.endMinutes / 5) * 5;
        } else {
          cur += 5;
        }
      }
      return null; // Overflows past bedtime
    };

    // Cascade each unlocked task
    for (const task of slotsToCascade) {
      const origStart = task.startMinutes ?? Scheduler.timeToMinutes(task.startTime);
      const duration = task.duration || (task.endMinutes - task.startMinutes);
      const targetStart = origStart + delayMinutes;

      const placedStart = findNextAvailable(targetStart, duration);

      if (placedStart !== null) {
        const placedEnd = placedStart + duration;
        finalDaySlots.push({
          ...task,
          startTime: Scheduler.minutesToTime(placedStart),
          endTime: Scheduler.minutesToTime(placedEnd),
          startMinutes: placedStart,
          endMinutes: placedEnd,
          wasShifted: true,
          shiftDelta: placedStart - origStart
        });
        shiftedCount++;
      } else {
        // Cannot fit within sleep limit
        overflowTasks.push({
          ...task,
          reason: 'Overflows past bedtime (' + (userProfile.sleepTime || '23:30') + ')'
        });
      }
    }

    // Sort final day slots chronologically
    finalDaySlots.sort((a, b) => a.startMinutes - b.startMinutes);

    return {
      updatedSlots: [...otherDateSlots, ...finalDaySlots],
      shiftedCount,
      overflowTasks
    };
  }
}
