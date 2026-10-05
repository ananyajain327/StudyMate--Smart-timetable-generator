/**
 * Streamlined State Store for StudyMate
 * Implements the core 3-step functional pipeline:
 * Step 1: Fixed College/School Timetable (locked: true)
 * Step 2: Automated Free-Slot Identification (8:00 AM - 10:00 PM)
 * Step 3: Priority-Based To-Do Panel & Auto-Fit Engine
 */

const STORAGE_KEY = 'studymate_streamlined_state_v1';

export class AppStore {
  constructor() {
    this.listeners = new Set();
    this.state = this._loadInitialState();
  }

  _loadInitialState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.classes) && Array.isArray(parsed.tasks)) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse saved state, resetting to defaults.', e);
      }
    }

    return this.getDemoState();
  }

  getDemoState() {
    return {
      settings: {
        dayStart: '08:00', // 8:00 AM
        dayEnd: '22:00',   // 10:00 PM
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      },
      // Step 1: Fixed college/school timetable (locked: true, muted slate)
      classes: [
        {
          id: 'cls_1',
          title: 'Data Structures & Algorithms',
          day: 'Mon',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Hall A',
          isLocked: true
        },
        {
          id: 'cls_2',
          title: 'Database Management Systems',
          day: 'Mon',
          startTime: '13:00',
          endTime: '14:30',
          room: 'Lab 3',
          isLocked: true
        },
        {
          id: 'cls_3',
          title: 'Computer Networks',
          day: 'Tue',
          startTime: '10:00',
          endTime: '11:30',
          room: 'Room 204',
          isLocked: true
        },
        {
          id: 'cls_4',
          title: 'Operating Systems Lab',
          day: 'Tue',
          startTime: '14:00',
          endTime: '16:30',
          room: 'Lab 1',
          isLocked: true
        },
        {
          id: 'cls_5',
          title: 'Software Engineering',
          day: 'Wed',
          startTime: '09:30',
          endTime: '11:00',
          room: 'Hall B',
          isLocked: true
        },
        {
          id: 'cls_6',
          title: 'Cloud Computing & DevOps',
          day: 'Thu',
          startTime: '11:00',
          endTime: '12:30',
          room: 'Room 105',
          isLocked: true
        },
        {
          id: 'cls_7',
          title: 'Discrete Mathematics',
          day: 'Fri',
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 302',
          isLocked: true
        },
        {
          id: 'cls_8',
          title: 'AI & Machine Learning',
          day: 'Fri',
          startTime: '14:00',
          endTime: '15:30',
          room: 'Auditorium',
          isLocked: true
        }
      ],
      // Step 2: Unoccupied time windows across 8 AM - 10 PM
      freeSlots: [],
      // Step 3: Study to-do backlog with priorities
      tasks: [
        {
          id: 'task_1',
          name: 'DSA LeetCode Hard Trees Problem Set',
          durationMinutes: 90,
          priority: 'High',
          completed: false
        },
        {
          id: 'task_2',
          name: 'DBMS SQL Query Optimization Assignment',
          durationMinutes: 60,
          priority: 'High',
          completed: false
        },
        {
          id: 'task_3',
          name: 'Networks Protocol Handshake Review',
          durationMinutes: 45,
          priority: 'Medium',
          completed: false
        },
        {
          id: 'task_4',
          name: 'Read OS Concurrency Chapter 6',
          durationMinutes: 60,
          priority: 'Medium',
          completed: false
        },
        {
          id: 'task_5',
          name: 'Review Software Architecture Slides',
          durationMinutes: 30,
          priority: 'Low',
          completed: false
        }
      ],
      // Step 3 (Output): Generated study slots filling free time
      scheduledStudySlots: []
    };
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state:', e);
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

  // --- Step 1: College Timetable Actions ---

  addClass(classData) {
    const newClass = {
      id: 'cls_' + Math.random().toString(36).substring(2, 9),
      title: classData.title || 'Untitled Class',
      day: classData.day || 'Mon',
      startTime: classData.startTime || '09:00',
      endTime: classData.endTime || '10:00',
      room: classData.room || '',
      isLocked: true
    };
    this.state.classes.push(newClass);
    this.notify('class_added');
    return newClass;
  }

  removeClass(id) {
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    this.notify('class_removed');
  }

  clearClasses() {
    this.state.classes = [];
    this.state.scheduledStudySlots = [];
    this.notify('classes_cleared');
  }

  // --- Step 2: Free Slot Updates ---

  setFreeSlots(freeSlots) {
    this.state.freeSlots = freeSlots;
    this.notify('free_slots_updated');
  }

  // --- Step 3: To-Do Task Actions ---

  addTask(taskData) {
    const newTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      name: taskData.name || 'Study Task',
      durationMinutes: parseInt(taskData.durationMinutes, 10) || 60,
      priority: taskData.priority || 'Medium',
      completed: false
    };
    this.state.tasks.push(newTask);
    this.notify('task_added');
    return newTask;
  }

  removeTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.state.scheduledStudySlots = this.state.scheduledStudySlots.filter(s => s.taskId !== id);
    this.notify('task_removed');
  }

  toggleTaskComplete(id) {
    const task = this.state.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      // Also update any scheduled slot for this task
      this.state.scheduledStudySlots.forEach(s => {
        if (s.taskId === id) s.completed = task.completed;
      });
      this.notify('task_toggled');
    }
  }

  // --- 1-Click Generator & Clear Actions ---

  setScheduledStudySlots(slots) {
    this.state.scheduledStudySlots = slots;
    this.notify('schedule_generated');
  }

  clearStudyPlan() {
    // Clears only auto-generated study slots, preserving college classes 100%!
    this.state.scheduledStudySlots = [];
    this.notify('study_plan_cleared');
  }

  removeScheduledSlot(slotId) {
    this.state.scheduledStudySlots = this.state.scheduledStudySlots.filter(s => s.id !== slotId);
    this.notify('slot_removed');
  }

  resetToDemo() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.getDemoState();
    this.notify('reset');
  }
}
