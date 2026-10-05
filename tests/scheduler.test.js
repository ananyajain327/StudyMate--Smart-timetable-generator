import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Scheduler, CHRONOTYPES } from '../js/engine/scheduler.js';

describe('Scheduler Engine', () => {
  it('auto-chunks large tasks (>90m) into optimal focus blocks', () => {
    const bigTask = {
      id: 'task_big',
      title: 'Full Stack Project',
      duration: 180, // 3 hours
      energyLevel: 'deep',
      priority: 'high',
      isLocked: false
    };

    const chunks = Scheduler.autoChunkTask(bigTask, { maxChunkDuration: 90 });
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].duration, 90);
    assert.equal(chunks[1].duration, 90);
    assert.equal(chunks[0].chunkIndex, 1);
    assert.equal(chunks[1].chunkIndex, 2);
    assert.equal(chunks[0].parentId, 'task_big');
  });

  it('allocates deep work to morning peak for Early Bird chronotype', () => {
    const deepTask = {
      id: 'deep_1',
      title: 'Algorithm Design',
      category: 'Computer Science',
      duration: 90,
      energyLevel: 'deep',
      priority: 'high',
      requestedStartMinutes: null
    };

    const result = Scheduler.generateSchedule({
      tasks: [deepTask],
      existingSlots: [],
      userProfile: {
        wakeTime: '07:00',
        sleepTime: '23:00',
        chronotype: CHRONOTYPES.EARLY_BIRD
      },
      targetDates: ['2026-10-06']
    });

    assert.equal(result.scheduledSlots.length, 1);
    const slot = result.scheduledSlots[0];
    // Early Bird peak is 7-10 AM (420 to 600 mins)
    assert.ok(slot.startMinutes >= 420 && slot.startMinutes <= 660,
      `Expected morning peak, got ${slot.startTime}`);
  });

  it('allocates deep work to evening peak for Night Owl chronotype', () => {
    const deepTask = {
      id: 'deep_2',
      title: 'Operating Systems Kernel',
      category: 'Computer Science',
      duration: 90,
      energyLevel: 'deep',
      priority: 'high',
      requestedStartMinutes: null
    };

    const result = Scheduler.generateSchedule({
      tasks: [deepTask],
      existingSlots: [],
      userProfile: {
        wakeTime: '09:00',
        sleepTime: '23:30',
        chronotype: CHRONOTYPES.NIGHT_OWL
      },
      targetDates: ['2026-10-06']
    });

    assert.equal(result.scheduledSlots.length, 1);
    const slot = result.scheduledSlots[0];
    // Night Owl peak is 6-10 PM (1080 to 1320 mins)
    assert.ok(slot.startMinutes >= 1080, `Expected evening peak, got ${slot.startTime}`);
  });

  it('minimizes context switching by clustering same category subjects', () => {
    const math1 = { id: 'm1', title: 'Calculus I', category: 'Mathematics', duration: 60, energyLevel: 'deep', priority: 'medium', requestedStartMinutes: null };
    const math2 = { id: 'm2', title: 'Linear Algebra', category: 'Mathematics', duration: 60, energyLevel: 'deep', priority: 'medium', requestedStartMinutes: null };

    const result = Scheduler.generateSchedule({
      tasks: [math1, math2],
      existingSlots: [],
      userProfile: {
        wakeTime: '08:00',
        sleepTime: '22:00',
        chronotype: CHRONOTYPES.EARLY_BIRD
      },
      targetDates: ['2026-10-06']
    });

    assert.equal(result.scheduledSlots.length, 2);
    const s1 = result.scheduledSlots[0];
    const s2 = result.scheduledSlots[1];
    // Check that math2 follows math1 with default buffer or consecutively
    const expectedStart = s1.endMinutes + (s1.bufferAfter || 0);
    assert.equal(s2.startMinutes, expectedStart, 'Consecutive clustering of same category');
  });
});
