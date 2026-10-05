/**
 * Two-Way Calendar Sync & Buffer Management for StudyMate Next-Gen
 * Supports:
 * 1. RFC 5545 iCalendar (.ics) generation for Google Calendar, Apple Calendar, Outlook
 * 2. iCalendar (.ics) parsing for importing external busy blocks
 * 3. Automated commute & transition padding (bufferBefore, bufferAfter)
 * 4. Conflict detection shader data provider
 */

import { Scheduler } from '../engine/scheduler.js';

export class CalendarSync {
  /**
   * Format Date to iCalendar UTC timestamp format (YYYYMMDDTHHMMSSZ)
   */
  static toICalDate(dateStr, timeStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [h, min] = timeStr.split(':').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, h, min, 0));
    return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  /**
   * Export timetable slots to RFC 5545 .ics formatted string
   * @param {Array<Object>} slots 
   * @param {string} [calendarName="StudyMate Schedule"]
   * @returns {string} .ics file content
   */
  static exportToICS(slots, calendarName = 'StudyMate AI Schedule') {
    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyMate AI//Smart Timetable Generator//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calendarName}`,
      'X-WR-TIMEZONE:UTC'
    ];

    for (const slot of slots) {
      const uid = `${slot.id || Math.random().toString(36).substring(2)}@studymate.ai`;
      const dtStart = CalendarSync.toICalDate(slot.date, slot.startTime);
      const dtEnd = CalendarSync.toICalDate(slot.date, slot.endTime);
      const summary = slot.title || 'Study Session';
      const description = [
        `Category: ${slot.category || 'General'}`,
        `Cognitive Intensity: ${slot.energyLevel || 'Deep Work'}`,
        `Priority: ${slot.priority || 'Medium'}`,
        slot.isLocked ? '[Locked Calendar Event]' : '[Dynamic Study Block]'
      ].join('\\n');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${nowStamp}`);
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`CATEGORIES:${slot.category || 'Study'}`);
      if (slot.isLocked) {
        lines.push('STATUS:CONFIRMED');
      } else {
        lines.push('STATUS:TENTATIVE');
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Parse an imported .ics string into structured slots with buffer padding
   * @param {string} icsString 
   * @param {Object} [options]
   * @returns {Array<Object>} Extracted calendar blocks
   */
  static importFromICS(icsString, options = {}) {
    const defaultBuffer = options.defaultBuffer ?? 15; // 15 mins commute/prep buffer
    const slots = [];

    // Simple robust iCalendar line unfold & event splitter
    const cleanContent = icsString.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const eventBlocks = cleanContent.split(/BEGIN:VEVENT/i);

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i].split(/END:VEVENT/i)[0];
      const summaryMatch = block.match(/SUMMARY:(.*)/i);
      const dtStartMatch = block.match(/DTSTART(?:;[^:]+)?:(\d{8}T\d{4,6}Z?)/i);
      const dtEndMatch = block.match(/DTEND(?:;[^:]+)?:(\d{8}T\d{4,6}Z?)/i);

      if (!dtStartMatch) continue;

      const title = summaryMatch ? summaryMatch[1].trim() : 'External Event';

      // Parse start datetime: YYYYMMDDTHHMM[SS]
      const rawStart = dtStartMatch[1];
      const y = rawStart.substring(0, 4);
      const m = rawStart.substring(4, 6);
      const d = rawStart.substring(6, 8);
      const startH = rawStart.substring(9, 11);
      const startMin = rawStart.substring(11, 13);

      const dateStr = `${y}-${m}-${d}`;
      const startTime = `${startH}:${startMin}`;
      const startMinutes = parseInt(startH, 10) * 60 + parseInt(startMin, 10);

      let endTime = Scheduler.minutesToTime(startMinutes + 60);
      let endMinutes = startMinutes + 60;

      if (dtEndMatch) {
        const rawEnd = dtEndMatch[1];
        const endH = rawEnd.substring(9, 11);
        const endM = rawEnd.substring(11, 13);
        endTime = `${endH}:${endM}`;
        endMinutes = parseInt(endH, 10) * 60 + parseInt(endM, 10);
      }

      const duration = Math.max(15, endMinutes - startMinutes);

      slots.push({
        id: `cal_ext_${Math.random().toString(36).substring(2, 9)}`,
        title,
        category: 'External Calendar',
        date: dateStr,
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        duration,
        energyLevel: 'review',
        priority: 'high',
        isLocked: true, // External calendar events are locked by default
        bufferBefore: defaultBuffer,
        bufferAfter: defaultBuffer,
        isExternal: true
      });
    }

    return slots;
  }

  /**
   * Scans a list of slots and identifies overlapping conflicts for UI shaders
   * @param {Array<Object>} slots 
   * @returns {Map<string, boolean>} Map of slot.id -> hasConflict
   */
  static detectConflicts(slots) {
    const conflictMap = new Map();

    for (let i = 0; i < slots.length; i++) {
      const s1 = slots[i];
      const s1Start = s1.startMinutes ?? Scheduler.timeToMinutes(s1.startTime);
      const s1End = s1.endMinutes ?? Scheduler.timeToMinutes(s1.endTime);

      for (let j = i + 1; j < slots.length; j++) {
        const s2 = slots[j];
        if (s1.date !== s2.date) continue;

        const s2Start = s2.startMinutes ?? Scheduler.timeToMinutes(s2.startTime);
        const s2End = s2.endMinutes ?? Scheduler.timeToMinutes(s2.endTime);

        // Check if intervals overlap
        if (Math.max(s1Start, s2Start) < Math.min(s1End, s2End)) {
          conflictMap.set(s1.id, true);
          conflictMap.set(s2.id, true);
        }
      }
    }

    return conflictMap;
  }
}
