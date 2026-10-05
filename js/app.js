/**
 * Main Application Controller for StudyMate Next-Gen
 * Wires the Reactive Store, NLP Command Bar, Domino Toolbar, Metrics, and Timeline Canvas.
 */

import { AppStore } from './state/store.js';
import { TimelineCanvas } from './canvas/timeline.js';
import { CHRONOTYPES } from './engine/scheduler.js';

export class StudyMateApp {
  constructor() {
    this.store = new AppStore();
    this.timelineCanvas = null;

    this.init();
  }

  init() {
    // 1. Initialize Canvas
    const canvasContainer = document.getElementById('timelineCanvasContainer');
    if (canvasContainer) {
      this.timelineCanvas = new TimelineCanvas(canvasContainer, this.store);
    }

    // 2. Set theme attribute
    document.documentElement.setAttribute('data-theme', this.store.getState().userProfile.theme || 'dark');

    // 3. Setup UI interactions
    this.setupCommandBar();
    this.setupDominoActions();
    this.setupViewControls();
    this.setupHeaderActions();
    this.setupKeyboardShortcuts();

    // 4. Subscribe to Store updates
    this.store.subscribe((state, event) => {
      this.updateMetrics();
      this.syncControls();
      if (this.timelineCanvas) {
        this.timelineCanvas.render();
      }
    });

    // Initial render of metrics
    this.updateMetrics();
    this.syncControls();
  }

  setupCommandBar() {
    const input = document.getElementById('commandInput');
    const form = document.getElementById('commandForm');
    const chips = document.querySelectorAll('.prompt-chip');

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          const res = this.store.executeNaturalLanguageInput(val);
          input.value = '';
          this.showFeedbackToast(res.success ? '✨ Schedule updated!' : (res.message || 'Action executed'));
        }
      });
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (input) {
          input.value = chip.dataset.prompt || chip.innerText.trim();
          input.focus();
        }
      });
    });
  }

  setupDominoActions() {
    const dominoContainer = document.querySelector('.domino-toolbar');
    if (dominoContainer) {
      dominoContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-domino]');
        if (btn) {
          const mins = parseInt(btn.dataset.domino, 10);
          const res = this.store.triggerDominoShift(mins);
          this.showFeedbackToast(`⚡ Domino shifted future tasks by ${mins}m (${res.shiftedCount} shifted)`);
        }
      });
    }
  }

  setupViewControls() {
    // Day vs Week view
    const viewGroup = document.getElementById('viewModeSegments');
    if (viewGroup) {
      viewGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-view]');
        if (btn) {
          this.store.setViewMode(btn.dataset.view);
        }
      });
    }

    // Chronotype Selector
    const chronoSelect = document.getElementById('chronotypeSelector');
    if (chronoSelect) {
      chronoSelect.addEventListener('change', (e) => {
        this.store.setChronotype(e.target.value);
        this.showFeedbackToast(`🧠 Chronotype set to ${e.target.value.replace('_', ' ').toUpperCase()}`);
      });
    }
  }

  setupHeaderActions() {
    // Rebalance / Auto-Schedule
    const rebalanceBtn = document.getElementById('rebalanceBtn');
    if (rebalanceBtn) {
      rebalanceBtn.addEventListener('click', () => {
        this.store.rebalanceSchedule();
        this.showFeedbackToast('🎯 Timetable dynamically optimized & cognitive-matched!');
      });
    }

    // Export iCal (.ics)
    const exportBtn = document.getElementById('exportCalBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const icsData = this.store.exportToICS();
        this.downloadFile('studymate_schedule.ics', icsData, 'text/calendar');
        this.showFeedbackToast('📅 iCal (.ics) exported successfully!');
      });
    }

    // Import iCal Modal
    const importBtn = document.getElementById('importCalBtn');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.openImportModal();
      });
    }

    // Dark / Light Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const cur = this.store.getState().userProfile.theme || 'dark';
        const next = cur === 'dark' ? 'light' : 'dark';
        this.store.setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        themeToggleBtn.innerText = next === 'dark' ? '🌙' : '☀️';
      });
    }
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // CMD+K or Ctrl+K opens/focuses Command Bar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = document.getElementById('commandInput');
        if (input) {
          input.focus();
          input.select();
        }
      }

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (this.store.undo()) {
          this.showFeedbackToast('↩️ Undone');
        }
      }

      // Redo: Ctrl+Y / Cmd+Shift+Z
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') ||
          ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (this.store.redo()) {
          this.showFeedbackToast('↪️ Redone');
        }
      }
    });
  }

  updateMetrics() {
    const state = this.store.getState();
    const todaySlots = state.slots.filter(s => s.date === state.selectedDate);

    // 1. Total Deep Work Minutes
    let deepWorkMins = 0;
    let totalStudyMins = 0;
    let contextSwitches = 0;
    let prevCategory = null;

    todaySlots.forEach(s => {
      const dur = s.duration || (s.endMinutes - s.startMinutes);
      totalStudyMins += dur;
      if (s.energyLevel === 'deep') deepWorkMins += dur;

      if (prevCategory && s.category !== prevCategory) {
        contextSwitches++;
      }
      prevCategory = s.category;
    });

    const deepHours = (deepWorkMins / 60).toFixed(1);
    const totalHours = (totalStudyMins / 60).toFixed(1);

    const deepWorkEl = document.getElementById('metricDeepWork');
    if (deepWorkEl) deepWorkEl.innerText = `${deepHours}h`;

    const totalHoursEl = document.getElementById('metricTotalHours');
    if (totalHoursEl) totalHoursEl.innerText = `${totalHours}h / ${state.userProfile.maxStudyHoursPerDay}h`;

    const switchesEl = document.getElementById('metricContextSwitches');
    if (switchesEl) switchesEl.innerText = `${contextSwitches} shifts`;
  }

  syncControls() {
    const state = this.store.getState();

    // Sync View Segments active state
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === state.viewMode);
    });

    // Sync Chronotype select
    const chronoSelect = document.getElementById('chronotypeSelector');
    if (chronoSelect) {
      chronoSelect.value = state.userProfile.chronotype || CHRONOTYPES.MODERATE;
    }
  }

  openImportModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Import Calendar (.ics)</h3>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 10px;">
            Paste an iCalendar (.ics) string from Google Calendar or Apple Calendar to import your locked events with automated commute/transition buffers.
          </p>
          <textarea id="icsInput" placeholder="BEGIN:VCALENDAR..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-confirm">Import Events</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.modal-close-btn').addEventListener('click', close);
    overlay.querySelector('.modal-cancel').addEventListener('click', close);

    overlay.querySelector('.modal-confirm').addEventListener('click', () => {
      const text = overlay.querySelector('#icsInput').value.trim();
      if (text) {
        const count = this.store.importICS(text);
        this.showFeedbackToast(`📅 Imported ${count} calendar events!`);
      }
      close();
    });
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
    const existing = document.querySelector('.feedback-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'feedback-toast';
    toast.innerText = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-medium);
      color: var(--text-primary);
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    `;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.studyMateApp = new StudyMateApp();
});
