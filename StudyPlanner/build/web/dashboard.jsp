<%@ include file="db.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
    return;
}

int userId = (Integer)session.getAttribute("user_id");
String name = (String)session.getAttribute("name");

int totalSubjects = 0;
int pendingTasks = 0;
int completedTasks = 0;

PreparedStatement ps1 = con.prepareStatement("SELECT COUNT(*) FROM subjects WHERE user_id=?");
ps1.setInt(1, userId);
ResultSet rs1 = ps1.executeQuery();
if(rs1.next()) totalSubjects = rs1.getInt(1);

PreparedStatement ps2 = con.prepareStatement("SELECT COUNT(*) FROM study_plan WHERE user_id=? AND status='Pending'");
ps2.setInt(1, userId);
ResultSet rs2 = ps2.executeQuery();
if(rs2.next()) pendingTasks = rs2.getInt(1);

PreparedStatement ps3 = con.prepareStatement("SELECT COUNT(*) FROM study_plan WHERE user_id=? AND status='Completed'");
ps3.setInt(1, userId);
ResultSet rs3 = ps3.executeQuery();
if(rs3.next()) completedTasks = rs3.getInt(1);
%>

<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="dashboard">

    <div class="sidebar">
        <h2>StudyMate</h2>
        <a href="dashboard.jsp">Dashboard</a>
        <a href="addSubject.jsp">Add Subject</a>
        <a href="viewSubjects.jsp">View Subjects</a>
        <a href="generatePlan.jsp">Generate Plan</a>
        <a href="viewPlan.jsp">View Plan</a>
        <a href="todayPlan.jsp">Today Plan</a>
        <a href="logout.jsp" class="logout">Logout</a>
    </div>

    <div class="main">

        <div class="dash-hero">
            <h1>Hello, <%= name %></h1>
            <p>Your study dashboard is ready. Start planning your day smartly.</p>
        </div>

        <div class="stat-grid">
            <div class="stat-card">
                <h3>Total Subjects</h3>
                <h2><%= totalSubjects %></h2>
            </div>

            <div class="stat-card">
                <h3>Pending Tasks</h3>
                <h2><%= pendingTasks %></h2>
            </div>

            <div class="stat-card">
                <h3>Completed Tasks</h3>
                <h2><%= completedTasks %></h2>
            </div>
        </div>

        <div class="quick-box">
            <h2>Quick Actions</h2>
            <p>Choose what you want to do next.</p>

            <div class="quick-actions">
                <a href="addSubject.jsp" class="quick-card">
                    <span>Add</span>
                    <h3>New Subject</h3>
                    <p>Add subjects with priority.</p>
                </a>

                <a href="generatePlan.jsp" class="quick-card">
                    <span>Plan</span>
                    <h3>Generate Schedule</h3>
                    <p>Create balanced study routine.</p>
                </a>

                <a href="viewPlan.jsp" class="quick-card">
                    <span>View</span>
                    <h3>My Schedule</h3>
                    <p>Check today’s full plan.</p>
                </a>
            </div>
        </div>

    </div>
</div>

</body>
</html>