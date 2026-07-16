<%@ include file="db.jsp" %>

<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
    return;
}

int userId = (Integer)session.getAttribute("user_id");

PreparedStatement ps = con.prepareStatement(
    "SELECT * FROM subjects WHERE user_id=? ORDER BY FIELD(priority,'High','Medium','Low'), exam_date"
);
ps.setInt(1, userId);
ResultSet rs = ps.executeQuery();
%>

<!DOCTYPE html>
<html>
<head>
    <title>Your Subjects</title>
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

        <div class="top-card">
            <h1>Your Subjects</h1>
            <p>Manage your subjects, priority and target date.</p>
        </div>

        <div class="subject-grid">

        <%
        boolean found = false;

        while(rs.next()) {
            found = true;
            String priority = rs.getString("priority");
            String pClass = priority.toLowerCase();
        %>

            <div class="subject-card <%= pClass %>-border">
                <div class="subject-top">
                    <div>
                        <h2><%= rs.getString("subject_name") %></h2>
                        <p>Target Date: <b><%= rs.getDate("exam_date") %></b></p>
                    </div>

                    <span class="badge <%= pClass %>"><%= priority %></span>
                </div>

                <div class="subject-actions">
                    <a class="delete-btn"
                       href="deleteSubject.jsp?id=<%= rs.getInt("subject_id") %>"
                       onclick="return confirm('Are you sure you want to delete this subject?');">
                       Delete
                    </a>
                </div>
            </div>

        <% } %>

        <% if(!found) { %>
            <div class="empty-plan">
                <h2>No subjects added yet</h2>
                <p>Add subjects first to generate your study plan.</p>
                <a href="addSubject.jsp" class="btn">Add Subject</a>
            </div>
        <% } %>

        </div>
    </div>
</div>

</body>
</html>