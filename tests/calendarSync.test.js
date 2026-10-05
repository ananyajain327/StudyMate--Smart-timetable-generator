import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CalendarSync } from '../js/sync/calendarSync.js';

describe('CalendarSync', () => {
  it('exports scheduled blocks to RFC 5545 standard .ics string', () => {
    const slots = [
      {
        id: 'slot_math',
        title: 'Advanced Calculus',
        category: 'Mathematics',
        date: '2026-10-06',
        startTime: '09:00',
        endTime: '10:30',
        energyLevel: 'deep',
        priority: 'high',
        isLocked: false
      }
    ];

    const ics = CalendarSync.exportToICS(slots, 'Test Schedule');
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /VERSION:2\.0/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /SUMMARY:Advanced Calculus/);
    assert.match(ics, /DTSTART:20261006T090000Z/);
    assert.match(ics, /DTEND:20261006T103000Z/);
    assert.match(ics, /END:VEVENT/);
    assert.match(ics, /END:VCALENDAR/);
  });

  it('imports .ics calendar and adds transition padding', () => {
    const rawIcs = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'SUMMARY:Dentist Appointment',
      'DTSTART:20261006T140000Z',
      'DTEND:20261006T150000Z',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const imported = CalendarSync.importFromICS(rawIcs, { defaultBuffer: 15 });
    assert.equal(imported.length, 1);
    const event = imported[0];
    assert.equal(event.title, 'Dentist Appointment');
    assert.equal(event.date, '2026-10-06');
    assert.equal(event.startTime, '14:00');
    assert.equal(event.endTime, '15:00');
    assert.equal(event.isLocked, true); // External events are locked
    assert.equal(event.bufferBefore, 15);
    assert.equal(event.bufferAfter, 15);
  });

  it('detects overlapping conflicts for UI shaders', () => {
    const slots = [
      { id: 's1', date: '2026-10-06', startTime: '10:00', endTime: '11:00', startMinutes: 600, endMinutes: 660 },
      { id: 's2', date: '2026-10-06', startTime: '10:30', endTime: '11:30', startMinutes: 630, endMinutes: 690 },
      { id: 's3', date: '2026-10-06', startTime: '12:00', endTime: '13:00', startMinutes: 720, endMinutes: 780 }
    ];

    const conflicts = CalendarSync.detectConflicts(slots);
    assert.equal(conflicts.get('s1'), true);
    assert.equal(conflicts.get('s2'), true);
    assert.equal(conflicts.get('s3'), undefined);
  });
});
