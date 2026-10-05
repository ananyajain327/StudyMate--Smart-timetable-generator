/**
 * Interactive Timeline Canvas for StudyMate Next-Gen
 * Features:
 * 1. Day / Week Multi-Day Timeline Canvas
 * 2. Magnetic 15-minute grid snapping
 * 3. Fluid drag-and-drop & visual duration stretching
 * 4. Real-time active block progress meters
 * 5. Conflict-highlighting shaders
 * 6. Live current-time marker with pulse indicator
 */

import { Scheduler } from '../engine/scheduler.js';
import { CalendarSync } from '../sync/calendarSync.js';

export class TimelineCanvas {
  constructor(containerElement, store) {
    this.container = containerElement;
    this.store = store;

    // Visual scale: 80 pixels per hour = 1.3333 pixels per minute
    this.pixelsPerHour = 80;
    this.pixelsPerMinute = this.pixelsPerHour / 60;
    this.gridSnapMinutes = 15;

    // Drag / Resize state
    this.dragState = null;

    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
    this.startLiveTicker();
  }

  startLiveTicker() {
    // Update live now line and active block progress every 15 seconds
    this.tickerInterval = setInterval(() => {
      this.updateNowIndicator();
      this.updateActiveBlockProgress();
    }, 15000);
  }

  destroy() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
    }
  }

  render() {
    const state = this.store.getState();
    const { slots, viewMode, selectedDate, userProfile } = state;

    const wakeMins = Scheduler.timeToMinutes(userProfile.wakeTime || '07:00');
    const sleepMins = Scheduler.timeToMinutes(userProfile.sleepTime || '23:30');
    const startHour = Math.max(0, Math.floor(wakeMins / 60) - 1);
    const endHour = Math.min(24, Math.ceil(sleepMins / 60) + 1);
    const totalHours = endHour - startHour;
    const canvasHeight = totalHours * this.pixelsPerHour;

    const conflictMap = CalendarSync.detectConflicts(slots);

    // Compute dates to display based on viewMode
    const datesToDisplay = [];
    if (viewMode === 'day') {
      datesToDisplay.push(selectedDate);
    } else {
      // 7-day week view starting from selectedDate (or Monday of that week)
      const base = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = base.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(base);
      monday.setDate(base.getDate() + mondayOffset);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesToDisplay.push(`${y}-${m}-${day}`);
      }
    }

    this.container.innerHTML = `
      <div class="timeline-wrapper ${viewMode}-view" style="--canvas-height: ${canvasHeight}px;">
        <div class="timeline-header-row">
          <div class="time-gutter-header">Time (24h)</div>
          <div class="days-header-group">
            ${datesToDisplay.map(dStr => {
              const dt = new Date(dStr + 'T00:00:00');
              const isToday = dStr === new Date().toISOString().split('T')[0];
              const isSelected = dStr === selectedDate;
              const dayName = dt.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = dt.getDate();
              return `
                <div class="day-col-header ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dStr}">
                  <span class="day-name">${dayName}</span>
                  <span class="day-num">${dayNum}</span>
                  ${isToday ? '<span class="today-pill">Today</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="timeline-body">
          <!-- Left Time Gutter -->
          <div class="time-gutter" style="height: ${canvasHeight}px;">
            ${Array.from({ length: totalHours + 1 }).map((_, idx) => {
              const hour = startHour + idx;
              const topPx = idx * this.pixelsPerHour;
              const timeLabel = `${String(hour).padStart(2, '0')}:00`;
              return `
                <div class="time-tick" style="top: ${topPx}px;">
                  <span class="time-label">${timeLabel}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Main Days Grid -->
          <div class="days-grid-container" style="height: ${canvasHeight}px;">
            <!-- Grid Hour Horizontal Lines -->
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
            <div class="day-columns-row">
              ${datesToDisplay.map(dateStr => {
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const daySlots = slots.filter(s => s.date === dateStr);

                return `
                  <div class="day-column" data-date="${dateStr}" style="height: ${canvasHeight}px;">
                    ${isToday ? `<div class="now-indicator-line" id="nowIndicator" style="display:none;"><div class="now-circle"></div></div>` : ''}

                    <!-- Scheduled Blocks in this column -->
                    ${daySlots.map(slot => {
                      const startMin = slot.startMinutes ?? Scheduler.timeToMinutes(slot.startTime);
                      const endMin = slot.endMinutes ?? Scheduler.timeToMinutes(slot.endTime);
                      const dur = endMin - startMin;

                      const topOffset = (startMin - (startHour * 60)) * this.pixelsPerMinute;
                      const blockHeight = Math.max(26, dur * this.pixelsPerMinute);
                      const hasConflict = conflictMap.has(slot.id);

                      const energyClass = `energy-${slot.energyLevel || 'deep'}`;
                      const priorityClass = `priority-${slot.priority || 'medium'}`;
                      const lockedClass = slot.isLocked ? 'is-locked' : 'is-unlocked';
                      const conflictClass = hasConflict ? 'has-conflict' : '';

                      return `
                        <div class="schedule-block ${energyClass} ${priorityClass} ${lockedClass} ${conflictClass}"
                             id="slot_${slot.id}"
                             data-slot-id="${slot.id}"
                             data-start-min="${startMin}"
                             data-end-min="${endMin}"
                             data-date="${slot.date}"
                             style="top: ${topOffset}px; height: ${blockHeight}px;">
                          
                          <!-- Progress Bar for Active Block -->
                          <div class="block-progress-fill" id="progress_${slot.id}" style="width: 0%;"></div>

                          <!-- Block Header -->
                          <div class="block-header">
                            <span class="block-title" title="${slot.title}">${slot.title}</span>
                            <div class="block-badges">
                              ${hasConflict ? '<span class="badge badge-conflict" title="Schedule Conflict!">⚠️ Conflict</span>' : ''}
                              <button class="lock-btn" data-action="toggle-lock" data-slot-id="${slot.id}" title="${slot.isLocked ? 'Locked (Immovable in domino shifts)' : 'Unlocked (Can auto-cascade)'}">
                                ${slot.isLocked ? '🔒' : '🔓'}
                              </button>
                            </div>
                          </div>

                          <!-- Block Meta -->
                          <div class="block-meta">
                            <span class="block-time">${slot.startTime} – ${slot.endTime}</span>
                            <span class="block-category-chip">${slot.category || 'Study'}</span>
                            ${slot.isChunk ? `<span class="badge badge-chunk">Part ${slot.chunkIndex}/${slot.totalChunks}</span>` : ''}
                          </div>

                          <!-- Bottom Resize Handle for visual duration stretching -->
                          ${!slot.isLocked ? `<div class="block-resize-handle" data-slot-id="${slot.id}" title="Drag to adjust duration"></div>` : ''}
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

    this.updateNowIndicator();
    this.updateActiveBlockProgress();
  }

  updateNowIndicator() {
    const indicator = this.container.querySelector('#nowIndicator');
    if (!indicator) return;

    const state = this.store.getState();
    const wakeMins = Scheduler.timeToMinutes(state.userProfile.wakeTime || '07:00');
    const startHour = Math.max(0, Math.floor(wakeMins / 60) - 1);

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const topPx = (currentMins - (startHour * 60)) * this.pixelsPerMinute;

    indicator.style.top = `${topPx}px`;
    indicator.style.display = 'block';
  }

  updateActiveBlockProgress() {
    const state = this.store.getState();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (const slot of state.slots) {
      const progressEl = this.container.querySelector(`#progress_${slot.id}`);
      if (!progressEl) continue;

      if (slot.date === todayStr && currentMins >= slot.startMinutes && currentMins <= slot.endMinutes) {
        const totalDur = slot.endMinutes - slot.startMinutes;
        const elapsed = currentMins - slot.startMinutes;
        const pct = Math.min(100, Math.max(0, Math.round((elapsed / totalDur) * 100)));
        progressEl.style.width = `${pct}%`;
        progressEl.closest('.schedule-block')?.classList.add('is-currently-active');
      } else {
        progressEl.style.width = '0%';
        progressEl.closest('.schedule-block')?.classList.remove('is-currently-active');
      }
    }
  }

  setupEventListeners() {
    // 1. Click handling for lock toggle and day header selection
    this.container.addEventListener('click', (e) => {
      const lockBtn = e.target.closest('[data-action="toggle-lock"]');
      if (lockBtn) {
        e.stopPropagation();
        const slotId = lockBtn.dataset.slotId;
        this.store.toggleSlotLock(slotId);
        return;
      }

      const dayHeader = e.target.closest('.day-col-header');
      if (dayHeader) {
        const date = dayHeader.dataset.date;
        if (date) {
          this.store.setSelectedDate(date);
        }
      }
    });

    // 2. Drag & Drop Movement and Stretch Resizing
    this.container.addEventListener('mousedown', (e) => {
      const resizeHandle = e.target.closest('.block-resize-handle');
      if (resizeHandle) {
        this._startResize(e, resizeHandle.dataset.slotId);
        return;
      }

      const block = e.target.closest('.schedule-block');
      if (block && !block.classList.contains('is-locked')) {
        // Prevent drag on lock button click
        if (e.target.closest('button')) return;
        this._startDrag(e, block.dataset.slotId, block);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.dragState) {
        this._handlePointerMove(e);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.dragState) {
        this._handlePointerUp(e);
      }
    });
  }

  _startDrag(e, slotId, blockEl) {
    e.preventDefault();
    const state = this.store.getState();
    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) return;

    const blockRect = blockEl.getBoundingClientRect();
    const offsetY = e.clientY - blockRect.top;

    this.dragState = {
      type: 'MOVE',
      slotId,
      initialStartMin: slot.startMinutes,
      duration: slot.duration || (slot.endMinutes - slot.startMinutes),
      offsetY,
      blockEl,
      currentDay: slot.date
    };

    blockEl.classList.add('is-dragging');
  }

  _startResize(e, slotId) {
    e.preventDefault();
    e.stopPropagation();
    const state = this.store.getState();
    const slot = state.slots.find(s => s.id === slotId);
    if (!slot) return;

    this.dragState = {
      type: 'RESIZE',
      slotId,
      startMin: slot.startMinutes,
      initialEndMin: slot.endMinutes,
      blockEl: this.container.querySelector(`#slot_${slotId}`)
    };

    this.dragState.blockEl?.classList.add('is-resizing');
  }

  _handlePointerMove(e) {
    if (!this.dragState) return;

    const state = this.store.getState();
    const wakeMins = Scheduler.timeToMinutes(state.userProfile.wakeTime || '07:00');
    const startHour = Math.max(0, Math.floor(wakeMins / 60) - 1);

    if (this.dragState.type === 'MOVE') {
      const dayCol = document.elementFromPoint(e.clientX, e.clientY)?.closest('.day-column');
      const targetDate = dayCol ? dayCol.dataset.date : this.dragState.currentDay;

      const columnRect = (dayCol || this.dragState.blockEl.parentElement).getBoundingClientRect();
      const relativeY = e.clientY - columnRect.top - this.dragState.offsetY;

      // Calculate minutes with magnetic 15m snapping
      const rawMinutes = (relativeY / this.pixelsPerMinute) + (startHour * 60);
      const snappedStart = Math.max(0, Math.min(24 * 60 - this.dragState.duration, Math.round(rawMinutes / this.gridSnapMinutes) * this.gridSnapMinutes));
      const topPx = (snappedStart - (startHour * 60)) * this.pixelsPerMinute;

      this.dragState.blockEl.style.top = `${topPx}px`;
      this.dragState.pendingStart = snappedStart;
      this.dragState.pendingDate = targetDate;
    }

    if (this.dragState.type === 'RESIZE') {
      const columnRect = this.dragState.blockEl.parentElement.getBoundingClientRect();
      const relativeY = e.clientY - columnRect.top;

      const rawEndMinutes = (relativeY / this.pixelsPerMinute) + (startHour * 60);
      const snappedEnd = Math.max(this.dragState.startMin + 15, Math.min(24 * 60, Math.round(rawEndMinutes / this.gridSnapMinutes) * this.gridSnapMinutes));

      const newHeight = (snappedEnd - this.dragState.startMin) * this.pixelsPerMinute;
      this.dragState.blockEl.style.height = `${newHeight}px`;
      this.dragState.pendingEnd = snappedEnd;
    }
  }

  _handlePointerUp() {
    if (!this.dragState) return;

    if (this.dragState.type === 'MOVE') {
      this.dragState.blockEl.classList.remove('is-dragging');
      if (this.dragState.pendingStart !== undefined) {
        this.store.moveSlot(this.dragState.slotId, this.dragState.pendingStart, this.dragState.pendingDate);
      }
    }

    if (this.dragState.type === 'RESIZE') {
      this.dragState.blockEl.classList.remove('is-resizing');
      if (this.dragState.pendingEnd !== undefined) {
        this.store.resizeSlot(this.dragState.slotId, this.dragState.pendingEnd);
      }
    }

    this.dragState = null;
  }
}
