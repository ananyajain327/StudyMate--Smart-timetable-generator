<%@ page contentType="text/html;charset=UTF-8" %>
<%@ include file="db.jsp" %>

<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
}

int userId = (Integer)session.getAttribute("user_id");

PreparedStatement ps = con.prepareStatement(
    "SELECT sp.plan_id, s.subject_name, s.priority, sp.study_date, sp.hours, sp.status " +
    "FROM study_plan sp JOIN subjects s ON sp.subject_id=s.subject_id " +
    "WHERE sp.user_id=? AND sp.study_date=CURDATE()"
);
ps.setInt(1, userId);
ResultSet rs = ps.executeQuery();
%>

<!DOCTYPE html>
<html>
<head>
    <title>Today Plan</title>
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
            <h1>Today’s Study Plan</h1>
            <p>Focus on today’s tasks only.</p>
        </div>

        <div class="table-box">
            <table>
                <tr>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Hours</th>
                    <th>Status</th>
                </tr>

                <%
                while(rs.next()) {
                    String p = rs.getString("priority").toLowerCase();
                %>

                <tr>
                    <td><%= rs.getString("subject_name") %></td>
                    <td><span class="badge <%= p %>"><%= rs.getString("priority") %></span></td>
                    <td><%= rs.getInt("hours") %> hrs</td>
                    <td><%= rs.getString("status") %></td>
                </tr>

                <% } %>
            </table>
        </div>
    </div>

</div>

</body>
</html>