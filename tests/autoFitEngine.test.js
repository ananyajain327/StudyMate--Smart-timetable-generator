import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AutoFitEngine } from '../js/engine/autoFitEngine.js';

describe('AutoFitEngine', () => {
  it('allocates high priority tasks into large gaps first', () => {
    const freeSlots = [
      { id: 'f1', day: 'Mon', startMinutes: 630, endMinutes: 690, durationMinutes: 60, startTime: '10:30', endTime: '11:30' }, // 1h gap
      { id: 'f2', day: 'Mon', startMinutes: 870, endMinutes: 1050, durationMinutes: 180, startTime: '14:30', endTime: '17:30' } // 3h gap
    ];

    const tasks = [
      { id: 't_low', name: 'Quick Email Check', durationMinutes: 30, priority: 'Low', completed: false },
      { id: 't_high', name: 'Compiler Design Project', durationMinutes: 120, priority: 'High', completed: false },
      { id: 't_med', name: 'Math Homework', durationMinutes: 60, priority: 'Medium', completed: false }
    ];

    const result = AutoFitEngine.fitTasks(tasks, freeSlots);

    assert.equal(result.scheduledStudySlots.length, 3);
    assert.equal(result.unallocatedTasks.length, 0);

    // The high priority task requires 120m, so it MUST go into the 180m gap (f2, starting at 14:30)
    const highSlot = result.scheduledStudySlots.find(s => s.taskId === 't_high');
    assert.equal(highSlot.startTime, '14:30');
    assert.equal(highSlot.endTime, '16:30');
    assert.equal(highSlot.priority, 'High');

    // The medium task (60m) fits into the 60m gap (f1, starting at 10:30)
    const medSlot = result.scheduledStudySlots.find(s => s.taskId === 't_med');
    assert.equal(medSlot.startTime, '10:30');
    assert.equal(medSlot.endTime, '11:30');

    // The low task (30m) fits into the remaining 60m of the second gap (16:30 - 17:00)
    const lowSlot = result.scheduledStudySlots.find(s => s.taskId === 't_low');
    assert.equal(lowSlot.startTime, '16:30');
    assert.equal(lowSlot.endTime, '17:00');
  });

  it('marks tasks as unallocated if free slots are insufficient', () => {
    const freeSlots = [
      { id: 'f1', day: 'Mon', startMinutes: 480, endMinutes: 540, durationMinutes: 60, startTime: '08:00', endTime: '09:00' }
    ];

    const tasks = [
      { id: 't1', name: 'Task 1', durationMinutes: 60, priority: 'High', completed: false },
      { id: 't2', name: 'Task 2', durationMinutes: 60, priority: 'Medium', completed: false }
    ];

    const result = AutoFitEngine.fitTasks(tasks, freeSlots);

    assert.equal(result.scheduledStudySlots.length, 1);
    assert.equal(result.scheduledStudySlots[0].taskId, 't1'); // Higher priority allocated
    assert.equal(result.unallocatedTasks.length, 1);
    assert.equal(result.unallocatedTasks[0].id, 't2');
  });
});
