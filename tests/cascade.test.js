import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DominoCascadeEngine } from '../js/engine/cascade.js';

describe('DominoCascadeEngine', () => {
  it('shifts unlocked future tasks forward by 30 mins while keeping locked events immovable', () => {
    const slots = [
      // 09:00 - 10:00 (Unlocked study session)
      {
        id: 'slot_1',
        title: 'Morning Study',
        date: '2026-10-06',
        startTime: '09:00',
        endTime: '10:00',
        startMinutes: 540,
        endMinutes: 600,
        duration: 60,
        isLocked: false
      },
      // 10:30 - 11:30 (Locked Class Lecture - IMMOVABLE)
      {
        id: 'slot_fixed',
        title: 'College Lecture',
        date: '2026-10-06',
        startTime: '10:30',
        endTime: '11:30',
        startMinutes: 630,
        endMinutes: 690,
        duration: 60,
        isLocked: true
      },
      // 11:30 - 12:30 (Unlocked second session)
      {
        id: 'slot_2',
        title: 'Afternoon Coding',
        date: '2026-10-06',
        startTime: '11:30',
        endTime: '12:30',
        startMinutes: 690,
        endMinutes: 750,
        duration: 60,
        isLocked: false
      }
    ];

    // User is running 30m late at 09:00
    const result = DominoCascadeEngine.dominoShift({
      slots,
      delayMinutes: 30,
      dateStr: '2026-10-06',
      pivotMinutes: 540,
      userProfile: { sleepTime: '23:00', wakeTime: '07:00' }
    });

    assert.equal(result.shiftedCount, 2);

    // Verify locked event was NOT moved
    const lecture = result.updatedSlots.find(s => s.id === 'slot_fixed');
    assert.equal(lecture.startTime, '10:30');
    assert.equal(lecture.endTime, '11:30');
    assert.equal(lecture.isLocked, true);

    // slot_1 target was 09:30 - 10:30.
    // Interval [09:30, 10:30] is completely free because lecture starts at 10:30!
    const s1 = result.updatedSlots.find(s => s.id === 'slot_1');
    assert.equal(s1.startTime, '09:30');
    assert.equal(s1.endTime, '10:30');

    // slot_2 target was 11:30 + 30m = 12:00.
    // Since lecture is 10:30-11:30, [12:00, 13:00] is free and slot_2 is placed at 12:00!
    const s2 = result.updatedSlots.find(s => s.id === 'slot_2');
    assert.equal(s2.startTime, '12:00');
    assert.equal(s2.endTime, '13:00');
  });

  it('jumps over locked events when delay would otherwise collide with them', () => {
    const slots = [
      // 09:30 - 10:30 (Unlocked study session)
      {
        id: 'task_collide',
        title: 'Physics Lab Prep',
        date: '2026-10-06',
        startTime: '09:30',
        endTime: '10:30',
        startMinutes: 570,
        endMinutes: 630,
        duration: 60,
        isLocked: false
      },
      // 10:00 - 12:00 (Locked Midterm Exam)
      {
        id: 'exam_fixed',
        title: 'Midterm Exam',
        date: '2026-10-06',
        startTime: '10:00',
        endTime: '12:00',
        startMinutes: 600,
        endMinutes: 720,
        duration: 120,
        isLocked: true
      }
    ];

    // Delayed by 45m at 09:30 -> target would be 10:15, which collides with Exam (10:00-12:00)!
    const result = DominoCascadeEngine.dominoShift({
      slots,
      delayMinutes: 45,
      dateStr: '2026-10-06',
      pivotMinutes: 570,
      userProfile: { sleepTime: '23:00', wakeTime: '07:00' }
    });

    const exam = result.updatedSlots.find(s => s.id === 'exam_fixed');
    assert.equal(exam.startTime, '10:00');
    assert.equal(exam.endTime, '12:00');

    const task = result.updatedSlots.find(s => s.id === 'task_collide');
    // Task must jump past exam and start at 12:00!
    assert.equal(task.startTime, '12:00');
    assert.equal(task.endTime, '13:00');
  });
});
