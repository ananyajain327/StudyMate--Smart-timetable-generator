/**
 * Unified Timetable Canvas for StudyMate
 * Renders the clean weekly 8:00 AM – 10:00 PM timetable grid displaying:
 * 1. Fixed College Classes (Solid, muted slate grey/blue, read-only/locked)
 * 2. Auto-Generated Study Slots (Vibrant readable priority badges, completion toggle)
 * 3. Unoccupied Remaining Time (Clean whitespace with subtle dashed borders)
 */

import { FreeSlotDetector } from '../engine/freeSlotDetector.js';

export class TimelineCanvas {
  constructor(containerElement, store) {
    this.container = containerElement;
    this.store = store;

    // Visual scale: 60px per hour = 1px per minute
    this.pixelsPerHour = 60;
    this.pixelsPerMinute = this.pixelsPerHour / 60;

    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const state = this.store.getState();
    const { classes, scheduledStudySlots, freeSlots, settings } = state;

    const startMin = FreeSlotDetector.timeToMinutes(settings.dayStart || '08:00');
    const endMin = FreeSlotDetector.timeToMinutes(settings.dayEnd || '22:00');
    const totalHours = (endMin - startMin) / 60;
    const canvasHeight = totalHours * this.pixelsPerHour;
    const activeDays = settings.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    this.container.innerHTML = `
      <div class="unified-timetable" style="--canvas-height: ${canvasHeight}px;">
        <!-- Header Row with Day Names -->
        <div class="timetable-header-row">
          <div class="time-col-header">Time</div>
          <div class="days-header-group">
            ${activeDays.map(day => `
              <div class="day-col-header" data-day="${day}">
                <span class="day-title">${day}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="timetable-body">
          <!-- Left Time Axis (8:00 AM to 10:00 PM) -->
          <div class="time-axis" style="height: ${canvasHeight}px;">
            ${Array.from({ length: totalHours + 1 }).map((_, idx) => {
              const currentMin = startMin + idx * 60;
              const topPx = idx * this.pixelsPerHour;
              const timeLabel = FreeSlotDetector.minutesTo12Hour(currentMin);
              return `
                <div class="time-axis-tick" style="top: ${topPx}px;">
                  <span class="time-label">${timeLabel}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Main Grid Area -->
          <div class="grid-days-container" style="height: ${canvasHeight}px;">
            <!-- Background Grid Lines -->
            <div class="grid-lines-layer">
              ${Array.from({ length: totalHours + 1 }).map((_, idx) => {
                const topPx = idx * this.pixelsPerHour;
                return `
                  <div class="grid-hour-line" style="top: ${topPx}px;"></div>
                  <div class="grid-half-hour-line" style="top: ${topPx + this.pixelsPerHour / 2}px;"></div>
                `;
              }).join('')}
            </div>

            <!-- Day Columns -->
            <div class="day-columns-layer">
              ${activeDays.map(day => {
                const dayClasses = classes.filter(c => c.day === day);
                const dayStudySlots = scheduledStudySlots.filter(s => s.day === day);
                const dayFreeSlots = freeSlots.filter(s => s.day === day);

                return `
                  <div class="day-grid-column" data-day="${day}" style="height: ${canvasHeight}px;">

                    <!-- Subtle Dashed Free Slot Placeholders -->
                    ${dayFreeSlots.map(fSlot => {
                      const topPx = (fSlot.startMinutes - startMin) * this.pixelsPerMinute;
                      const heightPx = Math.max(20, fSlot.durationMinutes * this.pixelsPerMinute);
                      return `
                        <div class="free-slot-ghost" style="top: ${topPx}px; height: ${heightPx}px;" title="Available Free Time: ${fSlot.durationLabel}">
                          <span class="free-ghost-label">Free ${fSlot.durationLabel}</span>
                        </div>
                      `;
                    }).join('')}

                    <!-- 1. Fixed College Classes (Muted Slate / Locked) -->
                    ${dayClasses.map(cls => {
                      const cStart = FreeSlotDetector.timeToMinutes(cls.startTime);
                      const cEnd = FreeSlotDetector.timeToMinutes(cls.endTime);
                      const dur = cEnd - cStart;
                      const topPx = (cStart - startMin) * this.pixelsPerMinute;
                      const heightPx = Math.max(26, dur * this.pixelsPerMinute);

                      return `
                        <div class="timetable-block class-block"
                             style="top: ${topPx}px; height: ${heightPx}px;"
                             data-class-id="${cls.id}">
                          <div class="block-top">
                            <span class="block-name" title="${cls.title}">${cls.title}</span>
                            <span class="lock-indicator" title="Fixed College Class">🔒 Locked</span>
                          </div>
                          <div class="block-info">
                            <span class="block-time">${cls.startTime} – ${cls.endTime}</span>
                            ${cls.room ? `<span class="room-chip">${cls.room}</span>` : ''}
                          </div>
                        </div>
                      `;
                    }).join('')}

                    <!-- 2. Auto-Generated Study Slots (Vibrant Priority Badges) -->
                    ${dayStudySlots.map(slot => {
                      const sStart = slot.startMinutes;
                      const sEnd = slot.endMinutes;
                      const dur = sEnd - sStart;
                      const topPx = (sStart - startMin) * this.pixelsPerMinute;
                      const heightPx = Math.max(28, dur * this.pixelsPerMinute);
                      const priorityClass = `priority-${(slot.priority || 'medium').toLowerCase()}`;
                      const completedClass = slot.completed ? 'is-completed' : '';

                      return `
                        <div class="timetable-block study-block ${priorityClass} ${completedClass}"
                             style="top: ${topPx}px; height: ${heightPx}px;"
                             data-slot-id="${slot.id}"
                             data-task-id="${slot.taskId}">
                          <div class="block-top">
                            <div class="study-title-group">
                              <input type="checkbox"
                                     class="slot-check"
                                     ${slot.completed ? 'checked' : ''}
                                     data-action="toggle-slot"
                                     data-task-id="${slot.taskId}"
                                     title="Mark Done">
                              <span class="block-name" title="${slot.taskName}">${slot.taskName}</span>
                            </div>
                            <button class="slot-delete-btn" data-action="delete-slot" data-slot-id="${slot.id}" title="Remove this study block">&times;</button>
                          </div>
                          <div class="block-info">
                            <span class="block-time">${slot.startTime} – ${slot.endTime}</span>
                            <span class="priority-badge">${slot.priority}</span>
                          </div>
                        </div>
                      `;
                    }).join('')}

                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.container.addEventListener('click', (e) => {
      // Toggle completion checkbox
      const check = e.target.closest('[data-action="toggle-slot"]');
      if (check) {
        e.stopPropagation();
        const taskId = check.dataset.taskId;
        this.store.toggleTaskComplete(taskId);
        return;
      }

      // Delete study slot
      const deleteBtn = e.target.closest('[data-action="delete-slot"]');
      if (deleteBtn) {
        e.stopPropagation();
        const slotId = deleteBtn.dataset.slotId;
        this.store.removeScheduledSlot(slotId);
      }
    });
  }
}
