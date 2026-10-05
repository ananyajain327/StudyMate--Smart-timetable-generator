/**
 * Main Controller for StudyMate 3-Step Timetable Pipeline
 * Step 1: Fixed College/School Timetable Input (Locked Slots)
 * Step 2: Automated Free-Slot Identification (Live sync)
 * Step 3: To-Do / Subject Priority Panel & 1-Click Auto-Fit Engine
 */

import { AppStore } from './state/store.js';
import { TimelineCanvas } from './canvas/timeline.js';
import { FreeSlotDetector } from './engine/freeSlotDetector.js';
import { AutoFitEngine } from './engine/autoFitEngine.js';
import { CalendarSync } from './sync/calendarSync.js';

export class StudyMateApp {
  constructor() {
    this.store = new AppStore();
    this.timelineCanvas = null;

    this.init();
  }

  init() {
    // 1. Calculate free slots immediately on startup
    this.recalculateFreeSlots(false);

    // 2. Initialize Canvas
    const canvasContainer = document.getElementById('timetableCanvasContainer');
    if (canvasContainer) {
      this.timelineCanvas = new TimelineCanvas(canvasContainer, this.store);
    }

    // 3. Setup User Interactions
    this.setupClassInputs();
    this.setupTaskInputs();
    this.setupGeneratorActions();
    this.setupHeaderActions();

    // 4. Subscribe to Store updates
    this.store.subscribe((state, event) => {
      if (event === 'class_added' || event === 'class_removed' || event === 'classes_cleared' || event === 'reset') {
        this.recalculateFreeSlots(false);
      }
      this.renderSidebarData();
      if (this.timelineCanvas) {
        this.timelineCanvas.render();
      }
    });

    // 5. Initial render of sidebar data
    this.renderSidebarData();
  }

  /**
   * Step 2: Automated Free-Slot Identification
   */
  recalculateFreeSlots(notify = true) {
    const state = this.store.getState();
    const freeSlots = FreeSlotDetector.detectFreeSlots(state.classes, {
      dayStart: state.settings.dayStart || '08:00',
      dayEnd: state.settings.dayEnd || '22:00',
      activeDays: state.settings.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });

    if (notify) {
      this.store.setFreeSlots(freeSlots);
    } else {
      state.freeSlots = freeSlots;
    }
  }

  setupClassInputs() {
    const form = document.getElementById('addClassForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('classTitleInput').value.trim();
        const day = document.getElementById('classDaySelect').value;
        const startTime = document.getElementById('classStartInput').value;
        const endTime = document.getElementById('classEndInput').value;
        const room = document.getElementById('classRoomInput').value.trim();

        if (title && startTime && endTime) {
          this.store.addClass({ title, day, startTime, endTime, room });
          document.getElementById('classTitleInput').value = '';
          document.getElementById('classRoomInput').value = '';
          this.showFeedbackToast(`🔒 Fixed class "${title}" added to ${day}!`);
        }
      });
    }

    // Class list delegate delete
    const classList = document.getElementById('classesListContainer');
    if (classList) {
      classList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-delete-class]');
        if (btn) {
          const id = btn.dataset.deleteClass;
          this.store.removeClass(id);
          this.showFeedbackToast('Class removed.');
        }
      });
    }
  }

  setupTaskInputs() {
    const form = document.getElementById('addTaskForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('taskNameInput').value.trim();
        const durationMinutes = parseInt(document.getElementById('taskDurationSelect').value, 10);
        const priority = document.getElementById('taskPrioritySelect').value;

        if (name) {
          this.store.addTask({ name, durationMinutes, priority });
          document.getElementById('taskNameInput').value = '';
          this.showFeedbackToast(`✨ Task added: ${name} (${priority} Priority)`);
        }
      });
    }

    // Task list actions (delete or toggle)
    const taskList = document.getElementById('tasksListContainer');
    if (taskList) {
      taskList.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-delete-task]');
        if (delBtn) {
          const id = delBtn.dataset.deleteTask;
          this.store.removeTask(id);
          this.showFeedbackToast('Task removed.');
          return;
        }

        const check = e.target.closest('[data-toggle-task]');
        if (check) {
          const id = check.dataset.toggleTask;
          this.store.toggleTaskComplete(id);
        }
      });
    }
  }

  /**
   * Step 3: 1-Click Generator & Clear Actions
   */
  setupGeneratorActions() {
    const fillBtn = document.getElementById('fillFreeTimeBtn');
    if (fillBtn) {
      fillBtn.addEventListener('click', () => {
        const state = this.store.getState();
        if (!state.tasks.length) {
          alert('Please add at least one study task before filling free time!');
          return;
        }

        // Run priority-based auto fit engine
        const result = AutoFitEngine.fitTasks(state.tasks, state.freeSlots);
        this.store.setScheduledStudySlots(result.scheduledStudySlots);

        const msg = `⚡ Scheduled ${result.stats.allocatedCount} study blocks (${result.stats.totalScheduledHours}h)!`;
        this.showFeedbackToast(msg);
      });
    }

    const clearPlanBtn = document.getElementById('clearStudyPlanBtn');
    if (clearPlanBtn) {
      clearPlanBtn.addEventListener('click', () => {
        this.store.clearStudyPlan();
        this.showFeedbackToast('🧹 Study plan cleared. College timetable remains intact!');
      });
    }
  }

  setupHeaderActions() {
    // Reset to Demo
    const resetBtn = document.getElementById('resetDemoBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset schedule to college demo state?')) {
          this.store.resetToDemo();
          this.showFeedbackToast('🔄 Reset to demo college timetable.');
        }
      });
    }

    // Export iCal (.ics)
    const exportBtn = document.getElementById('exportIcsBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const state = this.store.getState();
        const allSlots = [
          ...state.classes.map(c => ({
            id: c.id,
            title: `[Class] ${c.title}`,
            date: '2026-10-06',
            startTime: c.startTime,
            endTime: c.endTime,
            category: 'College',
            priority: 'High',
            isLocked: true
          })),
          ...state.scheduledStudySlots.map(s => ({
            id: s.id,
            title: `[Study] ${s.taskName}`,
            date: '2026-10-06',
            startTime: s.startTime,
            endTime: s.endTime,
            category: 'Study',
            priority: s.priority,
            isLocked: false
          }))
        ];

        const icsData = CalendarSync.exportToICS(allSlots, 'StudyMate Timetable');
        this.downloadFile('studymate_timetable.ics', icsData, 'text/calendar');
        this.showFeedbackToast('📅 iCal exported successfully!');
      });
    }
  }

  renderSidebarData() {
    const state = this.store.getState();

    // 1. Classes List
    const classesContainer = document.getElementById('classesListContainer');
    if (classesContainer) {
      if (!state.classes.length) {
        classesContainer.innerHTML = '<div class="empty-state">No classes added yet.</div>';
      } else {
        classesContainer.innerHTML = state.classes.map(cls => `
          <div class="sidebar-item class-item">
            <div class="item-main">
              <span class="item-title">${cls.title}</span>
              <span class="item-sub">${cls.day} • ${cls.startTime} - ${cls.endTime} ${cls.room ? '(' + cls.room + ')' : ''}</span>
            </div>
            <button class="item-del-btn" data-delete-class="${cls.id}" title="Delete class">&times;</button>
          </div>
        `).join('');
      }
    }

    // 2. Free Slots Summary
    const freeSlotsSummary = document.getElementById('freeSlotsSummary');
    if (freeSlotsSummary) {
      const totalFreeMinutes = state.freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);
      const totalHours = (totalFreeMinutes / 60).toFixed(1);
      freeSlotsSummary.innerHTML = `
        <div class="free-summary-pill">
          <strong>${state.freeSlots.length}</strong> unoccupied windows found (<strong>${totalHours}h</strong> total free time)
        </div>
        <div class="free-slots-scroll">
          ${state.freeSlots.slice(0, 8).map(slot => `
            <span class="free-slot-chip">${slot.label}</span>
          `).join('')}
          ${state.freeSlots.length > 8 ? `<span class="free-slot-chip more">+${state.freeSlots.length - 8} more</span>` : ''}
        </div>
      `;
    }

    // 3. Tasks List
    const tasksContainer = document.getElementById('tasksListContainer');
    if (tasksContainer) {
      if (!state.tasks.length) {
        tasksContainer.innerHTML = '<div class="empty-state">No study tasks in queue.</div>';
      } else {
        tasksContainer.innerHTML = state.tasks.map(task => `
          <div class="sidebar-item task-item priority-${task.priority.toLowerCase()} ${task.completed ? 'is-completed' : ''}">
            <input type="checkbox"
                   class="task-check"
                   ${task.completed ? 'checked' : ''}
                   data-toggle-task="${task.id}"
                   title="Toggle complete">
            <div class="item-main">
              <span class="item-title">${task.name}</span>
              <span class="item-sub">${task.durationMinutes}m • ${task.priority} Priority</span>
            </div>
            <button class="item-del-btn" data-delete-task="${task.id}" title="Delete task">&times;</button>
          </div>
        `).join('');
      }
    }

    // 4. Header Metrics
    const metricClasses = document.getElementById('metricClassesCount');
    if (metricClasses) metricClasses.innerText = `${state.classes.length} Classes`;

    const metricFree = document.getElementById('metricFreeHours');
    if (metricFree) {
      const freeMins = state.freeSlots.reduce((acc, s) => acc + s.durationMinutes, 0);
      metricFree.innerText = `${(freeMins / 60).toFixed(1)}h Free`;
    }

    const metricStudy = document.getElementById('metricStudyCount');
    if (metricStudy) {
      const studyMins = state.scheduledStudySlots.reduce((acc, s) => acc + s.durationMinutes, 0);
      metricStudy.innerText = `${state.scheduledStudySlots.length} Study Slots (${(studyMins / 60).toFixed(1)}h)`;
    }
  }

  downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  showFeedbackToast(message) {
    const existing = document.querySelector('.toast-banner');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-banner';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Bootstrap on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  window.studyMateApp = new StudyMateApp();
});
