# 📚 StudyMate — Smart Timetable Generator

**Study smarter, not harder** — a streamlined, clean smart timetable generator that maps your fixed college/school schedule, identifies all unoccupied free time, and automatically fits your study tasks based on priority.

[![License](https://img.shields.io/github/license/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=green)](./LICENSE)
[![CI](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)

---

## 🎯 The Core 3-Step Workflow

StudyMate follows a razor-sharp, zero-bloat 3-step scheduling pipeline:

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│         STEP 1          │  ──► │         STEP 2          │  ──► │         STEP 3          │
│ College/School Timetable│      │ Automated Free-Slot ID  │      │ To-Do Priority Auto-Fit │
│  (Locked / Slate Gray)  │      │ (Scan 8:00 AM-10:00 PM) │      │  (1-Click "Fill Time")  │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **Step 1: College/School Timetable Input (Locked Slots)**
   - Enter fixed lectures, labs, and tutorials.
   - Marked as `locked: true` and rendered in solid, muted slate grey/blue on the grid.
2. **Step 2: Automated Free-Slot Identification**
   - Automatically scans the 8:00 AM – 10:00 PM daily grid across the week.
   - Calculates every unoccupied time window between, before, and after classes (e.g., `Mon 10:30 AM - 1:00 PM [2.5h free]`).
3. **Step 3: To-Do / Subject Priority Panel & 1-Click Auto-Fit Engine**
   - Add study tasks with Name, Required Duration (30m, 45m, 1h, 1.5h, 2h), and Priority (🔴 High, 🟡 Medium, 🟢 Low).
   - Click **"⚡ Fill Free Time"**:
     - Sorts tasks by Priority (High -> Low) and duration.
     - Large continuous gaps receive High-Priority/deep study tasks; shorter gaps receive Quick-Review/Low-priority tasks.
     - Populates the timetable grid with distinct vibrant accent cards.
   - Click **"🧹 Clear Study Plan"** to wipe or re-shuffle study blocks without affecting the college schedule.

---

## 🏗️ Clean Modular Architecture

```
studymate-repo/
├── index.html                 # Clean 3-step dashboard layout
├── css/
│   └── app.css                # Slate classes, vibrant priority badges, dashed free slots
├── js/
│   ├── engine/
│   │   ├── freeSlotDetector.js# 8 AM - 10 PM unoccupied window scanner
│   │   └── autoFitEngine.js   # Priority-based to-do slot fitting algorithm
│   ├── canvas/
│   │   └── timeline.js        # Unified weekly 8 AM - 10 PM timetable canvas
│   ├── sync/
│   │   └── calendarSync.js    # RFC 5545 iCal (.ics) export & import
│   ├── state/
│   │   └── store.js           # Minimalist reactive store with local persistence
│   └── app.js                 # UI controller wiring the 3-step pipeline
├── tests/
│   ├── freeSlotDetector.test.js
│   ├── autoFitEngine.test.js
│   └── calendarSync.test.js
├── StudyPlanner/              # Classic Java Tomcat web application
│   └── web/
│       ├── nextgen.jsp        # 3-step pipeline bridge for Tomcat deployment
│       └── dashboard.jsp      # Updated navigation
└── database.sql               # Relational schema
```

---

## 🚀 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/ananyajain327/StudyMate--Smart-timetable-generator.git
cd StudyMate--Smart-timetable-generator

# 2. Run unit tests
npm test

# 3. Start development server
npm start
# -> Open http://localhost:3000 in your browser!
```

---

## 🧪 Automated Testing

All tests run natively with `node --test` with 100% pass rate:

```bash
$ npm test

▶ AutoFitEngine
  ✔ allocates high priority tasks into large gaps first (2.9ms)
  ✔ marks tasks as unallocated if free slots are insufficient (0.5ms)
✔ AutoFitEngine (5.3ms)

▶ CalendarSync
  ✔ exports scheduled blocks to RFC 5545 standard .ics string (2.4ms)
  ✔ imports .ics calendar and adds transition padding (0.9ms)
  ✔ detects overlapping conflicts for UI shaders (0.3ms)
✔ CalendarSync (5.0ms)

▶ FreeSlotDetector
  ✔ accurately identifies unoccupied windows before, between, and after classes (1.8ms)
  ✔ provides a complete 14-hour window when a day has no classes (2.5ms)
  ✔ handles back-to-back and overlapping classes gracefully (0.5ms)
✔ FreeSlotDetector (6.9ms)

ℹ tests 8
ℹ suites 3
ℹ pass 8
ℹ fail 0
```

---

## 👤 Author

**Ananya Jain** — [LinkedIn](https://www.linkedin.com/in/ananya-jain327) · [GitHub](https://github.com/ananyajain327)

---

<div align="center">⭐ If you find StudyMate helpful, give it a star!</div>
