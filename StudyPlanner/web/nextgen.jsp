<%@ include file="db.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
    return;
}
String name = (String)session.getAttribute("name");
%>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StudyMate — Smart Timetable Generator</title>
  <link rel="stylesheet" href="../../css/app.css">
  <style>
    .jsp-top-banner {
      background: rgba(99, 102, 241, 0.15);
      border-bottom: 1px solid rgba(99, 102, 241, 0.25);
      padding: 6px 24px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #c7d2fe;
    }
    .jsp-top-banner a {
      color: #a5b4fc;
      text-decoration: underline;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div class="jsp-top-banner">
    <span>Logged in as <strong><%= name %></strong> • 3-Step Smart Timetable Pipeline</span>
    <a href="dashboard.jsp">← Back to Classic Dashboard</a>
  </div>

  <!-- Top Header Navigation & Action Bar -->
  <header class="app-header">
    <div class="brand-section">
      <div class="brand-badge">📚</div>
      <div class="brand-info">
        <h1>StudyMate</h1>
        <p class="brand-sub">Smart Timetable Generator • 3-Step Free Time Pipeline</p>
      </div>
    </div>

    <!-- Live Grid Metrics Summary -->
    <div class="metrics-bar">
      <div class="metric-pill">
        <span class="metric-icon">🔒</span>
        <span class="metric-val" id="metricClassesCount">8 Classes</span>
      </div>
      <div class="metric-pill">
        <span class="metric-icon">⏳</span>
        <span class="metric-val" id="metricFreeHours">16.5h Free</span>
      </div>
      <div class="metric-pill">
        <span class="metric-icon">🎯</span>
        <span class="metric-val" id="metricStudyCount">0 Study Slots</span>
      </div>
    </div>

    <!-- Global Actions -->
    <div class="header-buttons">
      <button class="btn btn-primary" id="fillFreeTimeBtn" title="1-Click: Match to-do tasks into available free slots by priority">
        ⚡ Fill Free Time
      </button>
      <button class="btn btn-secondary" id="clearStudyPlanBtn" title="Clear generated study slots while preserving college classes">
        🧹 Clear Study Plan
      </button>
      <button class="btn btn-secondary" id="exportIcsBtn" title="Export schedule to standard .ics file">
        📅 Export iCal
      </button>
      <button class="btn btn-outline" id="resetDemoBtn" title="Restore sample college timetable and tasks">
        ↺ Reset Demo
      </button>
    </div>
  </header>

  <!-- Main App Shell -->
  <div class="app-layout">

    <!-- Left Sidebar: 3-Step Pipeline Panels -->
    <aside class="sidebar-panel">

      <!-- STEP 1: College/School Timetable (Locked Slots) -->
      <section class="step-card">
        <div class="step-header">
          <span class="step-number">1</span>
          <h3>College Timetable (Locked)</h3>
        </div>
        <p class="step-desc">Enter your fixed classes and labs. These remain immovable and locked.</p>

        <form id="addClassForm" class="clean-form">
          <input type="text" id="classTitleInput" placeholder="Subject / Lecture Name (e.g. Data Structures)" required>
          <div class="form-row">
            <select id="classDaySelect">
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
            </select>
            <input type="text" id="classRoomInput" placeholder="Room/Lab">
          </div>
          <div class="form-row">
            <input type="time" id="classStartInput" value="09:00" required>
            <span class="time-sep">to</span>
            <input type="time" id="classEndInput" value="10:30" required>
          </div>
          <button type="submit" class="btn btn-sm btn-secondary">+ Add Fixed Class</button>
        </form>

        <div id="classesListContainer" class="items-list-box"></div>
      </section>

      <!-- STEP 2: Automated Free-Slot Identification -->
      <section class="step-card">
        <div class="step-header">
          <span class="step-number">2</span>
          <h3>Free-Slot Detection (8 AM - 10 PM)</h3>
        </div>
        <p class="step-desc">Calculated unoccupied time gaps between and after your scheduled classes.</p>
        <div id="freeSlotsSummary" class="free-slots-box"></div>
      </section>

      <!-- STEP 3: To-Do / Subject Priority Panel -->
      <section class="step-card">
        <div class="step-header">
          <span class="step-number">3</span>
          <h3>To-Do Priority Backlog</h3>
        </div>
        <p class="step-desc">Add subjects or study tasks. The engine matches high-priority tasks into large gaps.</p>

        <form id="addTaskForm" class="clean-form">
          <input type="text" id="taskNameInput" placeholder="Study Task (e.g. LeetCode Trees Practice)" required>
          <div class="form-row">
            <select id="taskDurationSelect">
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60" selected>1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
            <select id="taskPrioritySelect">
              <option value="High">🔴 High Priority</option>
              <option value="Medium" selected>🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>
          <button type="submit" class="btn btn-sm btn-secondary">+ Add To-Do</button>
        </form>

        <div id="tasksListContainer" class="items-list-box"></div>
      </section>

    </aside>

    <!-- Right Canvas: Unified Weekly Timetable Grid -->
    <main class="canvas-panel">
      <!-- Grid Legend -->
      <div class="grid-legend">
        <span class="legend-item"><span class="legend-swatch swatch-class"></span> Fixed College Class (Locked)</span>
        <span class="legend-item"><span class="legend-swatch swatch-high"></span> High Priority Study</span>
        <span class="legend-item"><span class="legend-swatch swatch-med"></span> Medium Priority Study</span>
        <span class="legend-item"><span class="legend-swatch swatch-low"></span> Low Priority Study</span>
        <span class="legend-item"><span class="legend-swatch swatch-free"></span> Available Free Time Gap</span>
      </div>

      <!-- Main Weekly Canvas Component -->
      <div id="timetableCanvasContainer" class="timetable-container-box"></div>
    </main>

  </div>

  <script type="module" src="../../js/app.js"></script>
</body>
</html>
