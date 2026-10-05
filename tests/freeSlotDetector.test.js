import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FreeSlotDetector } from '../js/engine/freeSlotDetector.js';

describe('FreeSlotDetector', () => {
  it('accurately identifies unoccupied windows before, between, and after classes', () => {
    const classes = [
      {
        id: 'c1',
        title: 'Data Structures',
        day: 'Mon',
        startTime: '09:00',
        endTime: '10:30',
        isLocked: true
      },
      {
        id: 'c2',
        title: 'Database Systems',
        day: 'Mon',
        startTime: '13:00',
        endTime: '14:30',
        isLocked: true
      }
    ];

    const freeSlots = FreeSlotDetector.detectFreeSlots(classes, {
      dayStart: '08:00',
      dayEnd: '22:00',
      activeDays: ['Mon']
    });

    assert.equal(freeSlots.length, 3);

    // 1. Morning window before first class: 08:00 to 09:00 (60m)
    assert.equal(freeSlots[0].startTime, '08:00');
    assert.equal(freeSlots[0].endTime, '09:00');
    assert.equal(freeSlots[0].durationMinutes, 60);
    assert.equal(freeSlots[0].durationLabel, '1h');

    // 2. Midday gap between classes: 10:30 to 13:00 (150m = 2.5h)
    assert.equal(freeSlots[1].startTime, '10:30');
    assert.equal(freeSlots[1].endTime, '13:00');
    assert.equal(freeSlots[1].durationMinutes, 150);
    assert.equal(freeSlots[1].durationLabel, '2.5h');

    // 3. Evening gap after last class: 14:30 to 22:00 (450m = 7.5h)
    assert.equal(freeSlots[2].startTime, '14:30');
    assert.equal(freeSlots[2].endTime, '22:00');
    assert.equal(freeSlots[2].durationMinutes, 450);
    assert.equal(freeSlots[2].durationLabel, '7.5h');
  });

  it('provides a complete 14-hour window when a day has no classes', () => {
    const freeSlots = FreeSlotDetector.detectFreeSlots([], {
      dayStart: '08:00',
      dayEnd: '22:00',
      activeDays: ['Sun']
    });

    assert.equal(freeSlots.length, 1);
    assert.equal(freeSlots[0].day, 'Sun');
    assert.equal(freeSlots[0].startTime, '08:00');
    assert.equal(freeSlots[0].endTime, '22:00');
    assert.equal(freeSlots[0].durationMinutes, 14 * 60);
  });

  it('handles back-to-back and overlapping classes gracefully', () => {
    const classes = [
      { id: 'c1', title: 'Lab Part 1', day: 'Wed', startTime: '10:00', endTime: '11:00' },
      { id: 'c2', title: 'Lab Part 2', day: 'Wed', startTime: '11:00', endTime: '12:30' } // Touching at 11:00
    ];

    const freeSlots = FreeSlotDetector.detectFreeSlots(classes, {
      dayStart: '08:00',
      dayEnd: '22:00',
      activeDays: ['Wed']
    });

    // Should only have 2 free slots: 08:00-10:00 (2h) and 12:30-22:00 (9.5h)
    assert.equal(freeSlots.length, 2);
    assert.equal(freeSlots[0].startTime, '08:00');
    assert.equal(freeSlots[0].endTime, '10:00');
    assert.equal(freeSlots[1].startTime, '12:30');
    assert.equal(freeSlots[1].endTime, '22:00');
  });
});
