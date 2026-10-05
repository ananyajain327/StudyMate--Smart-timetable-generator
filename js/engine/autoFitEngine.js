/**
 * Priority-Based Auto-Fit Engine for StudyMate
 * Features:
 * 1. Sorts tasks by Priority (High -> Medium -> Low).
 * 2. Matches tasks into available free-slots based on duration.
 * 3. High-Priority tasks are matched into large continuous gaps.
 * 4. Shorter gaps receive Quick-Review / Medium / Low priority tasks.
 * 5. Populates timetable grid with generated study blocks in distinct accent colors.
 */

import { FreeSlotDetector } from './freeSlotDetector.js';

export class AutoFitEngine {
  /**
   * Fits to-do tasks into available free slots based on priority and duration
   * @param {Array<Object>} tasks - List of to-do items { id, name, durationMinutes, priority }
   * @param {Array<Object>} freeSlots - Output of FreeSlotDetector.detectFreeSlots
   * @returns {Object} { scheduledStudySlots, unallocatedTasks, stats }
   */
  static fitTasks(tasks = [], freeSlots = []) {
    const priorityWeights = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    // 1. Filter out completed tasks and sort by Priority descending, then duration descending
    const pendingTasks = tasks
      .filter(t => !t.completed)
      .map(t => ({
        ...t,
        durationMinutes: parseInt(t.durationMinutes, 10) || 60,
        priority: t.priority || 'Medium'
      }))
      .sort((a, b) => {
        const pA = priorityWeights[a.priority] || 2;
        const pB = priorityWeights[b.priority] || 2;
        if (pB !== pA) return pB - pA; // High priority first
        return b.durationMinutes - a.durationMinutes; // Longer tasks first
      });

    // 2. Clone free slots as mutable segments
    const availableSegments = freeSlots
      .map(slot => ({
        day: slot.day,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        remainingMinutes: slot.durationMinutes,
        totalCapacity: slot.durationMinutes
      }))
      .filter(s => s.remainingMinutes >= 15);

    const scheduledStudySlots = [];
    const unallocatedTasks = [];

    // 3. Match each task into the best available free slot
    for (const task of pendingTasks) {
      const taskDur = task.durationMinutes;

      // Find eligible segments with enough remaining capacity
      const eligibleSegments = availableSegments.filter(s => s.remainingMinutes >= taskDur);

      if (!eligibleSegments.length) {
        unallocatedTasks.push(task);
        continue;
      }

      // Selection strategy:
      // - High priority tasks choose the largest available gap
      // - Medium/Low priority tasks choose the best-fitting tightest gap to preserve large gaps for high-priority
      let chosenSegment = null;
      if (task.priority === 'High') {
        // Pick the segment with maximum remaining capacity
        chosenSegment = eligibleSegments.reduce((max, s) => s.remainingMinutes > max.remainingMinutes ? s : max, eligibleSegments[0]);
      } else {
        // Pick the segment closest to the task duration (best-fit), or earliest
        chosenSegment = eligibleSegments.reduce((best, s) => {
          const diffCurrent = s.remainingMinutes - taskDur;
          const diffBest = best.remainingMinutes - taskDur;
          return diffCurrent < diffBest ? s : best;
        }, eligibleSegments[0]);
      }

      // Allocate task into chosen segment
      const slotStart = chosenSegment.startMinutes;
      const slotEnd = slotStart + taskDur;

      scheduledStudySlots.push({
        id: `study_${task.id}_${Math.random().toString(36).substring(2, 7)}`,
        taskId: task.id,
        taskName: task.name,
        day: chosenSegment.day,
        startTime: FreeSlotDetector.minutesToTime(slotStart),
        endTime: FreeSlotDetector.minutesToTime(slotEnd),
        startMinutes: slotStart,
        endMinutes: slotEnd,
        durationMinutes: taskDur,
        priority: task.priority,
        completed: false,
        isLocked: false // Study blocks can be re-shuffled or deleted
      });

      // Update segment remaining time and advance start pointer
      chosenSegment.startMinutes = slotEnd;
      chosenSegment.remainingMinutes -= taskDur;

      // If segment has less than 15 minutes left, remove it from candidate pool
      if (chosenSegment.remainingMinutes < 15) {
        const idx = availableSegments.indexOf(chosenSegment);
        if (idx !== -1) availableSegments.splice(idx, 1);
      }
    }

    // Sort scheduled study slots by day and start time
    const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    scheduledStudySlots.sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dDiff !== 0) return dDiff;
      return a.startMinutes - b.startMinutes;
    });

    const totalScheduledMinutes = scheduledStudySlots.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalFreeMinutes = freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);

    return {
      scheduledStudySlots,
      unallocatedTasks,
      stats: {
        allocatedCount: scheduledStudySlots.length,
        unallocatedCount: unallocatedTasks.length,
        totalScheduledMinutes,
        totalScheduledHours: (totalScheduledMinutes / 60).toFixed(1),
        remainingFreeMinutes: Math.max(0, totalFreeMinutes - totalScheduledMinutes),
        remainingFreeHours: (Math.max(0, totalFreeMinutes - totalScheduledMinutes) / 60).toFixed(1)
      }
    };
  }
}
