# 📚⚡ StudyMate AI — Next-Gen Smart Timetable Generator

**Study smarter, not harder** — transformed into a living, reactive timetable engine that adapts instantly to delays, cognitive energy levels, and unexpected interruptions with zero user friction.

[![License](https://img.shields.io/github/license/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=green)](./LICENSE)
[![CI](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)

---

## ⚡ What's New in v2.0 AI Next-Gen

StudyMate v2.0 evolves from a static schedule generator into a **living, reactive cognitive timetable operating system**:

1. **⚡ Dynamic Cascade Engine ("Domino" Auto-Shift):**
   - Single-click **"Running 30m Late"** (+15m, +30m, +45m, +60m) buttons.
   - Automatically ripples future unlocked tasks forward while keeping fixed calendar events (lectures, exams, syncs) rock-solid and jumping over obstacles.
2. **🧠 Cognitive Load & Chronotype Matching:**
   - Tasks tagged by mental strain (**Deep Work**, **Shallow/Admin**, **Review**).
   - Dynamically schedules deep focus into the user's natural peak windows (**Early Bird**, **Moderate**, **Night Owl**).
3. **✂️ Smart Auto-Chunking & Spaced Allocation:**
   - Massive tasks (e.g. "10-hour research project") automatically split into optimal 60–90 min focus blocks distributed across days before the deadline.
4. **🔄 Context-Switching Minimizer:**
   - Batches similar subjects/domain categories consecutively to eliminate attention residue and mental fatigue.
5. **⌨️ Zero-Friction Natural Language Command Bar (`Ctrl+K` / `⌘K`):**
   - Dump thoughts freely: *"Prep presentation 2h tomorrow before 4pm, high focus"* or *"Calculus problem set 90m today at 10am urgent"*.
6. **📅 Two-Way Cal Sync & Transition Buffers:**
   - Instant RFC 5545 `.ics` export/import for Google Calendar, Apple Calendar, and Outlook with automated 15m commute/prep buffers and conflict-highlighting shaders.
7. **🎨 Minimalist Modern SaaS Aesthetics (Linear / Cron / Notion-style):**
   - High-density dark/light themes, live current time marker with pulse, active task real-time progress meters, and magnetic 15-minute drag-and-drop snapping with duration stretch handles.

---

## 🏗️ Architecture & Component Decoupling

```
studymate-repo/
├── index.html                # Modern desktop/mobile SaaS reactive application
├── css/
│   └── app.css               # Design system, glassmorphic tokens, conflict shaders, themes
├── js/
│   ├── parser/
│   │   └── nlpParser.js      # Natural Language & CMD+K command bar entity extractor
│   ├── engine/
│   │   ├── scheduler.js      # Chronotype solver, auto-chunker, context minimizer
│   │   └── cascade.js        # Domino cascade engine with locked event immunity
│   ├── canvas/
│   │   └── timeline.js       # Magnetic drag-and-drop timeline with stretch handles
│   ├── sync/
│   │   └── calendarSync.js   # RFC 5545 iCal export/import & transition padding
│   ├── state/
│   │   └── store.js          # Optimistic reactive store with undo/redo & local persistence
│   └── app.js                # App controller, keyboard shortcuts, metrics & toast feedback
├── tests/                    # Comprehensive automated test suite (node:test)
│   ├── nlpParser.test.js
│   ├── scheduler.test.js
│   ├── cascade.test.js
│   └── calendarSync.test.js
├── StudyPlanner/             # Legacy Java Tomcat web app with nextgen.jsp bridge
│   └── web/
│       ├── nextgen.jsp       # Embedded Next-Gen AI interface for Tomcat deployment
│       └── dashboard.jsp     # Updated navigation
└── database.sql              # Relational schema enriched with cognitive load & lock fields
```

---

## 🚀 Quick Start

### Option A: Next-Gen Modern Web App (Recommended)

Requires Node.js (v18+):

```bash
# 1. Clone repository
git clone https://github.com/ananyajain327/StudyMate--Smart-timetable-generator.git
cd StudyMate--Smart-timetable-generator

# 2. Run automated test suite
npm test

# 3. Start local development server
npm start
# -> Open http://localhost:3000 in your browser!
```

### Option B: Classic Java / Tomcat Server

1. Import `database.sql` into MySQL Server 8.x.
2. Open `StudyPlanner/` in Apache NetBeans or deploy to Apache Tomcat 9+.
3. Visit `http://localhost:8080/StudyPlanner/` and click **"⚡ Next-Gen AI Timetable"** in the sidebar.

---

## 🧪 Automated Testing

Run the full suite of unit tests verifying NLP parsing, cognitive scheduling, domino cascade shift, and iCal sync:

```bash
npm test
```

All 16 core engine tests execute with native `node:test` in sub-second speed with zero third-party dependencies!

---

## 👤 Author

**Ananya Jain** — [LinkedIn](https://www.linkedin.com/in/ananya-jain327) · [GitHub](https://github.com/ananyajain327)

---

<div align="center">⭐ If you find StudyMate AI helpful, give it a star!</div>
