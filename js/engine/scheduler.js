/**
 * Intelligent Scheduler Solver for StudyMate Next-Gen
 * Features:
 * 1. Cognitive Load & Chronotype Matching (Early Bird, Moderate, Night Owl)
 * 2. Smart Auto-Chunking & Spaced Allocation (splits >90m tasks into optimal 60-90m blocks across days)
 * 3. Context-Switching Minimizer (groups tasks by domain/category to eliminate attention residue)
 * 4. Conflict-Free Buffers & Transition Padding
 */

export const CHRONOTYPES = {
  EARLY_BIRD: 'early_bird',
  MODERATE: 'moderate',
  NIGHT_OWL: 'night_owl'
};

// Energy score curves (0 to 100) mapped by hour of day (0-23)
export const ENERGY_CURVES = {
  [CHRONOTYPES.EARLY_BIRD]: [
    10, 10, 10, 10, 20, 50, 75, 90, 95, 90, 85, 70, // 0 - 11 AM (Peak: 7-10 AM)
    50, 45, 60, 75, 70, 60, 50, 40, 30, 20, 10, 10  // 12 - 11 PM
  ],
  [CHRONOTYPES.MODERATE]: [
    10, 10, 10, 10, 15, 30, 50, 65, 80, 88, 92, 85, // 0 - 11 AM (Peak: 9 AM - 12 PM)
    60, 55, 75, 85, 80, 65, 55, 45, 35, 25, 15, 10  // 12 - 11 PM (Secondary peak: 2-4 PM)
  ],
  [CHRONOTYPES.NIGHT_OWL]: [
    15, 15, 10, 10, 10, 15, 25, 35, 45, 55, 65, 70, // 0 - 11 AM (Slow start)
    65, 60, 70, 80, 85, 80, 88, 95, 95, 90, 75, 40  // 12 - 11 PM (Peak: 6-10 PM)
  ]
};

export class Scheduler {
  /**
   * Helper: convert "HH:MM" (24h) to minutes from midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  /**
   * Helper: convert minutes from midnight to "HH:MM"
   */
  static minutesToTime(minutes) {
    const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Evaluates cognitive fit between task energy level and user energy score at slot
   * @param {string} energyLevel 'deep' | 'shallow' | 'review' | 'break'
   * @param {number} energyScore (0 to 100)
   * @returns {number} match score (0 to 100)
   */
  static getCognitiveMatchScore(energyLevel, energyScore) {
    switch (energyLevel) {
      case 'deep':
        // Deep work scales directly with peak energy: 95 > 70
        return energyScore;
      case 'review':
        // Review works best at moderate energy (50-75)
        return 100 - Math.abs(65 - energyScore);
      case 'shallow':
        // Shallow work is ideal during low energy dips (<60)
        return 100 - energyScore;
      default:
        return 50;
    }
  }

  /**
   * Auto-chunks massive tasks into optimal focus intervals (default 60-90m)
   * @param {Object} task 
   * @param {Object} [options]
   * @returns {Array<Object>} List of task chunks
   */
  static autoChunkTask(task, options = {}) {
    const maxChunkDuration = options.maxChunkDuration || 90; // mins
    const minChunkDuration = options.minChunkDuration || 45; // mins

    // If task is locked or already small enough, do not chunk
    if (task.isLocked || task.duration <= maxChunkDuration) {
      return [{
        ...task,
        isChunk: false,
        chunkIndex: 1,
        totalChunks: 1
      }];
    }

    const totalMinutes = task.duration;
    // Determine number of chunks
    let numChunks = Math.ceil(totalMinutes / maxChunkDuration);
    let chunkDuration = Math.round(totalMinutes / numChunks);

    // Keep chunk duration snap to 15m intervals if possible
    chunkDuration = Math.round(chunkDuration / 15) * 15;
    if (chunkDuration < minChunkDuration) chunkDuration = minChunkDuration;

    const chunks = [];
    let allocated = 0;

    for (let i = 0; i < numChunks; i++) {
      const remaining = totalMinutes - allocated;
      const currentChunkDur = (i === numChunks - 1) ? remaining : Math.min(chunkDuration, remaining);

      chunks.push({
        ...task,
        id: `${task.id}_chunk_${i + 1}`,
        parentId: task.id,
        title: `${task.title} (Part ${i + 1}/${numChunks})`,
        duration: currentChunkDur,
        isChunk: true,
        chunkIndex: i + 1,
        totalChunks: numChunks
      });

      allocated += currentChunkDur;
      if (allocated >= totalMinutes) break;
    }

    return chunks;
  }

  /**
   * Finds free available time windows in a day, given existing locked and booked slots
   */
  static getAvailableWindows(dateStr, existingSlots, userProfile) {
    const wakeMins = Scheduler.timeToMinutes(userProfile.wakeTime || '07:00');
    const sleepMins = Scheduler.timeToMinutes(userProfile.sleepTime || '23:00');

    // Filter slots for this specific date and sort by startMinutes
    const daySlots = (existingSlots || [])
      .filter(s => s.date === dateStr)
      .map(s => ({
        start: s.startMinutes ?? Scheduler.timeToMinutes(s.startTime),
        end: s.endMinutes ?? Scheduler.timeToMinutes(s.endTime),
        bufferBefore: s.bufferBefore || 0,
        bufferAfter: s.bufferAfter || 0,
        isLocked: !!s.isLocked,
        title: s.title
      }))
      .sort((a, b) => a.start - b.start);

    // Compute occupied ranges including buffer padding
    const occupied = [];
    for (const slot of daySlots) {
      const startPadded = Math.max(wakeMins, slot.start - slot.bufferBefore);
      const endPadded = Math.min(sleepMins, slot.end + slot.bufferAfter);
      occupied.push({ start: startPadded, end: endPadded });
    }

    // Merge overlapping occupied intervals
    const mergedOccupied = [];
    for (const occ of occupied) {
      if (!mergedOccupied.length) {
        mergedOccupied.push({ ...occ });
      } else {
        const last = mergedOccupied[mergedOccupied.length - 1];
        if (occ.start <= last.end) {
          last.end = Math.max(last.end, occ.end);
        } else {
          mergedOccupied.push({ ...occ });
        }
      }
    }

    // Free windows between wake and sleep
    const freeWindows = [];
    let cur = wakeMins;

    for (const occ of mergedOccupied) {
      if (occ.start > cur) {
        freeWindows.push({ start: cur, end: occ.start, duration: occ.start - cur });
      }
      cur = Math.max(cur, occ.end);
    }

    if (cur < sleepMins) {
      freeWindows.push({ start: cur, end: sleepMins, duration: sleepMins - cur });
    }

    return freeWindows.filter(w => w.duration >= 15);
  }

  /**
   * Generates a fully optimized schedule for tasks across target dates
   * @param {Object} params
   * @param {Array<Object>} params.tasks
   * @param {Array<Object>} params.existingSlots
   * @param {Object} params.userProfile
   * @param {Array<string>} params.targetDates (e.g. ['2026-10-05', '2026-10-06'])
   * @returns {Object} { scheduledSlots, unallocatedTasks }
   */
  static generateSchedule({ tasks = [], existingSlots = [], userProfile = {}, targetDates = [] }) {
    const profile = {
      wakeTime: '07:00',
      sleepTime: '23:00',
      chronotype: CHRONOTYPES.MODERATE,
      maxStudyHoursPerDay: 8,
      defaultBufferMinutes: 10,
      breakDuration: 15,
      ...userProfile
    };

    const scheduledSlots = [...existingSlots];
    const unallocatedTasks = [];

    // 1. Preprocess: Auto-chunk massive tasks
    const allTaskUnits = [];
    for (const task of tasks) {
      if (task.isLocked) {
        allTaskUnits.push(task);
      } else {
        const chunks = Scheduler.autoChunkTask(task, {
          maxChunkDuration: profile.maxChunkDuration || 90,
          minChunkDuration: 45
        });
        allTaskUnits.push(...chunks);
      }
    }

    // 2. Sort task units by:
    // a) Explicit requested start time (must be scheduled first)
    // b) Priority (urgent > high > medium > low)
    // c) Cognitive intensity (deep work requires prime slots)
    // d) Category clustering (context minimizer)
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    allTaskUnits.sort((a, b) => {
      if (a.requestedStartMinutes !== null && b.requestedStartMinutes === null) return -1;
      if (b.requestedStartMinutes !== null && a.requestedStartMinutes === null) return 1;
      const pDiff = (priorityWeights[b.priority] || 2) - (priorityWeights[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      if (a.energyLevel === 'deep' && b.energyLevel !== 'deep') return -1;
      if (b.energyLevel === 'deep' && a.energyLevel !== 'deep') return 1;
      return (a.category || '').localeCompare(b.category || '');
    });

    // Track daily study minutes to enforce maxStudyHoursPerDay
    const dailyStudyMinutes = {};
    for (const d of targetDates) {
      dailyStudyMinutes[d] = 0;
    }

    // Calculate existing daily study minutes
    for (const slot of existingSlots) {
      if (dailyStudyMinutes[slot.date] !== undefined) {
        const dur = (slot.endMinutes || 0) - (slot.startMinutes || 0);
        dailyStudyMinutes[slot.date] += dur;
      }
    }

    const maxDailyMinutes = profile.maxStudyHoursPerDay * 60;
    const energyCurve = ENERGY_CURVES[profile.chronotype] || ENERGY_CURVES[CHRONOTYPES.MODERATE];

    // 3. Allocate each task unit
    for (const taskUnit of allTaskUnits) {
      let isPlaced = false;

      // Determine eligible dates for this task
      let eligibleDates = targetDates;
      if (taskUnit.date) {
        eligibleDates = targetDates.includes(taskUnit.date) ? [taskUnit.date] : [taskUnit.date, ...targetDates];
      }

      // Spaced allocation for chunks of same parent: spread chunks across successive days if available
      if (taskUnit.isChunk && taskUnit.chunkIndex > 1) {
        const dayOffset = Math.min(taskUnit.chunkIndex - 1, eligibleDates.length - 1);
        if (dayOffset > 0) {
          eligibleDates = [eligibleDates[dayOffset], ...eligibleDates.filter((_, idx) => idx !== dayOffset)];
        }
      }

      for (const dateStr of eligibleDates) {
        if ((dailyStudyMinutes[dateStr] || 0) + taskUnit.duration > maxDailyMinutes) {
          continue; // Day study capacity reached
        }

        const freeWindows = Scheduler.getAvailableWindows(dateStr, scheduledSlots, profile);
        if (!freeWindows.length) continue;

        // If user specified exact start time
        if (taskUnit.requestedStartMinutes !== null) {
          const reqStart = taskUnit.requestedStartMinutes;
          const reqEnd = reqStart + taskUnit.duration;

          // Check if window fits
          const matchingWindow = freeWindows.find(w => w.start <= reqStart && w.end >= reqEnd);
          if (matchingWindow) {
            const newSlot = {
              id: `slot_${Math.random().toString(36).substring(2, 9)}`,
              taskId: taskUnit.id,
              title: taskUnit.title,
              category: taskUnit.category,
              date: dateStr,
              startTime: Scheduler.minutesToTime(reqStart),
              endTime: Scheduler.minutesToTime(reqEnd),
              startMinutes: reqStart,
              endMinutes: reqEnd,
              duration: taskUnit.duration,
              energyLevel: taskUnit.energyLevel,
              priority: taskUnit.priority,
              isLocked: !!taskUnit.isLocked,
              isChunk: !!taskUnit.isChunk,
              parentId: taskUnit.parentId,
              bufferBefore: profile.defaultBufferMinutes,
              bufferAfter: profile.defaultBufferMinutes
            };

            scheduledSlots.push(newSlot);
            dailyStudyMinutes[dateStr] = (dailyStudyMinutes[dateStr] || 0) + taskUnit.duration;
            isPlaced = true;
            break;
          }
        }

        // Find candidate starting positions (stepped by 15 mins) and evaluate score
        let bestCandidate = null;
        let bestCandidateScore = -1;

        for (const window of freeWindows) {
          if (window.duration < taskUnit.duration) continue;

          for (let start = window.start; start + taskUnit.duration <= window.end; start += 15) {
            const end = start + taskUnit.duration;

            // Check deadline constraint
            if (taskUnit.deadlineMinutes && end > taskUnit.deadlineMinutes) {
              continue;
            }

            // Calculate hour for energy curve
            const hour = Math.min(23, Math.floor(start / 60));
            const energyScore = energyCurve[hour];
            const cognitiveFit = Scheduler.getCognitiveMatchScore(taskUnit.energyLevel, energyScore);

            // Context-switching penalty/bonus: check adjacent slots on this date
            let contextBonus = 0;
            const adjacentSlot = scheduledSlots.find(s => s.date === dateStr && (s.endMinutes === start || s.startMinutes === end));
            if (adjacentSlot && adjacentSlot.category === taskUnit.category) {
              contextBonus = 25; // Bonus for grouping same subject!
            }

            // Time preference bonus
            let timePrefBonus = 0;
            if (taskUnit.timePreference === 'morning' && start >= 420 && start < 720) timePrefBonus = 20;
            if (taskUnit.timePreference === 'afternoon' && start >= 720 && start < 1080) timePrefBonus = 20;
            if (taskUnit.timePreference === 'evening' && start >= 1080) timePrefBonus = 20;

            const totalScore = cognitiveFit + contextBonus + timePrefBonus;

            if (totalScore > bestCandidateScore) {
              bestCandidateScore = totalScore;
              bestCandidate = { start, end };
            }
          }
        }

        if (bestCandidate) {
          const newSlot = {
            id: `slot_${Math.random().toString(36).substring(2, 9)}`,
            taskId: taskUnit.id,
            title: taskUnit.title,
            category: taskUnit.category,
            date: dateStr,
            startTime: Scheduler.minutesToTime(bestCandidate.start),
            endTime: Scheduler.minutesToTime(bestCandidate.end),
            startMinutes: bestCandidate.start,
            endMinutes: bestCandidate.end,
            duration: taskUnit.duration,
            energyLevel: taskUnit.energyLevel,
            priority: taskUnit.priority,
            isLocked: !!taskUnit.isLocked,
            isChunk: !!taskUnit.isChunk,
            parentId: taskUnit.parentId,
            bufferBefore: profile.defaultBufferMinutes,
            bufferAfter: profile.defaultBufferMinutes
          };

          scheduledSlots.push(newSlot);
          dailyStudyMinutes[dateStr] = (dailyStudyMinutes[dateStr] || 0) + taskUnit.duration;
          isPlaced = true;
          break;
        }
      }

      if (!isPlaced) {
        unallocatedTasks.push(taskUnit);
      }
    }

    // Sort scheduledSlots by date and startMinutes
    scheduledSlots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMinutes - b.startMinutes;
    });

    return {
      scheduledSlots,
      unallocatedTasks
    };
  }
}
