/**
 * Reactive Store for StudyMate Next-Gen
 * Provides optimistic state updates, undo/redo history, localStorage persistence,
 * and pub/sub event subscription for all UI components.
 */

import { NLPParser } from '../parser/nlpParser.js';
import { Scheduler, CHRONOTYPES } from '../engine/scheduler.js';
import { DominoCascadeEngine } from '../engine/cascade.js';
import { CalendarSync } from '../sync/calendarSync.js';

const STORAGE_KEY = 'studymate_nextgen_state_v2';

export class AppStore {
  constructor() {
    this.listeners = new Set();
    this.historyStack = [];
    this.historyPointer = -1;
    this.maxHistory = 50;

    this.state = this._loadInitialState();
    this._saveToHistory(false);
  }

  _getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  _getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  _loadInitialState() {
    const today = this._getTodayStr();
    const tomorrow = this._getTomorrowStr();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.slots)) {
          return {
            ...parsed,
            selectedDate: parsed.selectedDate || today
          };
        }
      } catch (e) {
        console.warn('Failed to parse saved state, resetting to defaults.', e);
      }
    }

    // Default rich sample dataset demonstrating full feature capabilities
    return {
      userProfile: {
        name: 'Ananya Jain',
        chronotype: CHRONOTYPES.MODERATE,
        wakeTime: '07:30',
        sleepTime: '23:30',
        maxStudyHoursPerDay: 7,
        defaultBufferMinutes: 15,
        theme: 'dark'
      },
      selectedDate: today,
      viewMode: 'day', // 'day' | 'week'
      tasks: [
        {
          id: 'task_demo_1',
          title: 'Distributed Systems Raft Consensus Paper',
          category: 'Computer Science',
          duration: 90,
          energyLevel: 'deep',
          priority: 'urgent',
          deadlineMinutes: 17 * 60,
          date: today,
          isLocked: false
        },
        {
          id: 'task_demo_2',
          title: 'Weekly Sprint Backlog & Code Review',
          category: 'Admin',
          duration: 45,
          energyLevel: 'shallow',
          priority: 'medium',
          date: today,
          isLocked: false
        }
      ],
      slots: [
        {
          id: 'slot_meal_1',
          taskId: 'task_meal_1',
          title: 'Breakfast & Morning Briefing',
          category: 'Life',
          date: today,
          startTime: '08:00',
          endTime: '08:45',
          startMinutes: 480,
          endMinutes: 525,
          duration: 45,
          energyLevel: 'shallow',
          priority: 'low',
          isLocked: true,
          bufferBefore: 0,
          bufferAfter: 15
        },
        {
          id: 'slot_deep_1',
          taskId: 'task_ai_1',
          title: 'Neural Networks & Transformer Architecture',
          category: 'Computer Science',
          date: today,
          startTime: '09:00',
          endTime: '10:30',
          startMinutes: 540,
          endMinutes: 630,
          duration: 90,
          energyLevel: 'deep',
          priority: 'urgent',
          isLocked: false,
          bufferBefore: 15,
          bufferAfter: 15
        },
        {
          id: 'slot_fixed_col',
          taskId: 'task_col_1',
          title: 'Algorithms & Complexity Lecture (Locked)',
          category: 'Computer Science',
          date: today,
          startTime: '11:00',
          endTime: '12:30',
          startMinutes: 660,
          endMinutes: 750,
          duration: 90,
          energyLevel: 'deep',
          priority: 'high',
          isLocked: true,
          bufferBefore: 15,
          bufferAfter: 15
        },
        {
          id: 'slot_lunch_1',
          taskId: 'task_lunch_1',
          title: 'Lunch & Power Walk',
          category: 'Life',
          date: today,
          startTime: '12:45',
          endTime: '13:30',
          startMinutes: 765,
          endMinutes: 810,
          duration: 45,
          energyLevel: 'shallow',
          priority: 'medium',
          isLocked: true,
          bufferBefore: 0,
          bufferAfter: 15
        },
        {
          id: 'slot_rev_1',
          taskId: 'task_calc_1',
          title: 'Linear Algebra & Eigenvalues Problem Set',
          category: 'Mathematics',
          date: today,
          startTime: '14:00',
          endTime: '15:30',
          startMinutes: 840,
          endMinutes: 930,
          duration: 90,
          energyLevel: 'deep',
          priority: 'high',
          isLocked: false,
          bufferBefore: 15,
          bufferAfter: 15
        },
        {
          id: 'slot_admin_1',
          taskId: 'task_inbox_1',
          title: 'Email Inbox Zero & Project Sync',
          category: 'Admin',
          date: today,
          startTime: '16:00',
          endTime: '16:45',
          startMinutes: 960,
          endMinutes: 1005,
          duration: 45,
          energyLevel: 'shallow',
          priority: 'low',
          isLocked: false,
          bufferBefore: 10,
          bufferAfter: 10
        },
        // Tomorrow tasks
        {
          id: 'slot_tmrw_1',
          taskId: 'task_tmrw_1',
          title: 'Database Query Optimization & Indexing',
          category: 'Computer Science',
          date: tomorrow,
          startTime: '09:00',
          endTime: '10:30',
          startMinutes: 540,
          endMinutes: 630,
          duration: 90,
          energyLevel: 'deep',
          priority: 'high',
          isLocked: false,
          bufferBefore: 15,
          bufferAfter: 15
        }
      ]
    };
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  _saveToHistory(record = true) {
    if (record) {
      this.historyStack = this.historyStack.slice(0, this.historyPointer + 1);
      this.historyStack.push(JSON.parse(JSON.stringify(this.state)));
      if (this.historyStack.length > this.maxHistory) {
        this.historyStack.shift();
      }
      this.historyPointer = this.historyStack.length - 1;
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event = 'state_change') {
    this._persist();
    for (const listener of this.listeners) {
      listener(this.state, event);
    }
  }

  undo() {
    if (this.historyPointer > 0) {
      this.historyPointer--;
      this.state = JSON.parse(JSON.stringify(this.historyStack[this.historyPointer]));
      this.notify('undo');
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyPointer < this.historyStack.length - 1) {
      this.historyPointer++;
      this.state = JSON.parse(JSON.stringify(this.historyStack[this.historyPointer]));
      this.notify('redo');
      return true;
    }
    return false;
  }

  /**
   * Natural Language Command Bar Handler (CMD+K / Ctrl+K)
   */
  executeNaturalLanguageInput(input) {
    const result = NLPParser.parse(input, new Date(this.state.selectedDate));

    if (result.type === 'COMMAND') {
      if (result.command === 'DOMINO_SHIFT') {
        return this.triggerDominoShift(result.minutes);
      }
      if (result.command === 'REBALANCE') {
        return this.rebalanceSchedule();
      }
    }

    if (result.type === 'TASK') {
      // Direct optimistic allocation through the scheduler
      const allocation = Scheduler.generateSchedule({
        tasks: [result],
        existingSlots: this.state.slots,
        userProfile: this.state.userProfile,
        targetDates: [result.date || this.state.selectedDate]
      });

      this.state.slots = allocation.scheduledSlots;
      if (allocation.unallocatedTasks.length > 0) {
        this.state.tasks.push(...allocation.unallocatedTasks);
      }

      this._saveToHistory();
      this.notify('task_added');
      return { success: true, task: result, unallocated: allocation.unallocatedTasks.length > 0 };
    }

    return { success: false, message: 'Unrecognized input pattern' };
  }

  /**
   * Domino Cascade Shift (e.g. +30m Late)
   */
  triggerDominoShift(minutes = 30) {
    const result = DominoCascadeEngine.dominoShift({
      slots: this.state.slots,
      delayMinutes: minutes,
      dateStr: this.state.selectedDate,
      userProfile: this.state.userProfile
    });

    this.state.slots = result.updatedSlots;
    this._saveToHistory();
    this.notify('domino_shifted');
    return result;
  }

  /**
   * Rebalance / Auto-schedule all pending tasks and non-locked slots
   */
  rebalanceSchedule() {
    const lockedSlots = this.state.slots.filter(s => s.isLocked);
    const unlockedAsTasks = this.state.slots
      .filter(s => !s.isLocked)
      .map(s => ({
        id: s.taskId || s.id,
        title: s.title,
        category: s.category,
        duration: s.duration || (s.endMinutes - s.startMinutes),
        energyLevel: s.energyLevel || 'deep',
        priority: s.priority || 'medium',
        date: s.date,
        isLocked: false
      }));

    const allTasksToSchedule = [...this.state.tasks, ...unlockedAsTasks];
    this.state.tasks = [];

    const targetDates = [this.state.selectedDate];
    // Add tomorrow as target date
    const d = new Date(this.state.selectedDate);
    d.setDate(d.getDate() + 1);
    targetDates.push(d.toISOString().split('T')[0]);

    const result = Scheduler.generateSchedule({
      tasks: allTasksToSchedule,
      existingSlots: lockedSlots,
      userProfile: this.state.userProfile,
      targetDates
    });

    this.state.slots = result.scheduledSlots;
    this.state.tasks = result.unallocatedTasks;

    this._saveToHistory();
    this.notify('rebalanced');
    return result;
  }

  /**
   * Drag and drop slot movement with optimistic update and magnetic snapping
   */
  moveSlot(slotId, newStartMinutes, newDate = null) {
    const slotIndex = this.state.slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return false;

    const slot = this.state.slots[slotIndex];
    if (slot.isLocked) return false; // Locked slots cannot be dragged

    const duration = slot.duration || (slot.endMinutes - slot.startMinutes);
    const snappedStart = Math.round(newStartMinutes / 15) * 15;
    const snappedEnd = snappedStart + duration;

    this.state.slots[slotIndex] = {
      ...slot,
      date: newDate || slot.date,
      startTime: Scheduler.minutesToTime(snappedStart),
      endTime: Scheduler.minutesToTime(snappedEnd),
      startMinutes: snappedStart,
      endMinutes: snappedEnd
    };

    this._saveToHistory();
    this.notify('slot_moved');
    return true;
  }

  /**
   * Resize slot duration (bottom stretch handle)
   */
  resizeSlot(slotId, newEndMinutes) {
    const slotIndex = this.state.slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) return false;

    const slot = this.state.slots[slotIndex];
    if (slot.isLocked) return false;

    const snappedEnd = Math.round(newEndMinutes / 15) * 15;
    if (snappedEnd <= slot.startMinutes + 15) return false; // min 15 mins

    const newDuration = snappedEnd - slot.startMinutes;

    this.state.slots[slotIndex] = {
      ...slot,
      endTime: Scheduler.minutesToTime(snappedEnd),
      endMinutes: snappedEnd,
      duration: newDuration
    };

    this._saveToHistory();
    this.notify('slot_resized');
    return true;
  }

  /**
   * Toggle slot locked / unlocked status
   */
  toggleSlotLock(slotId) {
    const slot = this.state.slots.find(s => s.id === slotId);
    if (slot) {
      slot.isLocked = !slot.isLocked;
      this._saveToHistory();
      this.notify('slot_lock_toggled');
      return slot.isLocked;
    }
    return false;
  }

  /**
   * Delete a scheduled slot
   */
  deleteSlot(slotId) {
    this.state.slots = this.state.slots.filter(s => s.id !== slotId);
    this._saveToHistory();
    this.notify('slot_deleted');
  }

  /**
   * Set user chronotype
   */
  setChronotype(chronotype) {
    this.state.userProfile.chronotype = chronotype;
    this._saveToHistory();
    this.notify('chronotype_changed');
  }

  /**
   * Set theme (dark / light)
   */
  setTheme(theme) {
    this.state.userProfile.theme = theme;
    this._saveToHistory();
    this.notify('theme_changed');
  }

  /**
   * Set timeline view mode ('day' | 'week')
   */
  setViewMode(viewMode) {
    this.state.viewMode = viewMode;
    this.notify('view_mode_changed');
  }

  /**
   * Set selected date ('YYYY-MM-DD')
   */
  setSelectedDate(dateStr) {
    this.state.selectedDate = dateStr;
    this.notify('date_selected');
  }

  /**
   * Export to iCal (.ics) string
   */
  exportToICS() {
    return CalendarSync.exportToICS(this.state.slots, `${this.state.userProfile.name}'s Schedule`);
  }

  /**
   * Import external iCal (.ics) string
   */
  importICS(icsString) {
    const newSlots = CalendarSync.importFromICS(icsString, {
      defaultBuffer: this.state.userProfile.defaultBufferMinutes
    });

    if (newSlots.length > 0) {
      this.state.slots.push(...newSlots);
      this._saveToHistory();
      this.notify('calendar_imported');
      return newSlots.length;
    }
    return 0;
  }

  /**
   * Reset to initial demo state
   */
  resetToDemo() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this._loadInitialState();
    this._saveToHistory();
    this.notify('reset');
  }
}
