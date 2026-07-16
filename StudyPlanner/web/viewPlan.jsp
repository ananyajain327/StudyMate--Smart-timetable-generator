<%@ include file="db.jsp" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>

<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
    return;
}

int userId = (Integer)session.getAttribute("user_id");

PreparedStatement ps = con.prepareStatement(
    "SELECT sp.plan_id, s.subject_name, s.priority, sp.study_date, sp.start_time, sp.end_time, sp.status, sp.task_type " +
    "FROM study_plan sp JOIN subjects s ON sp.subject_id=s.subject_id " +
    "WHERE sp.user_id=? ORDER BY sp.start_time"
);
ps.setInt(1, userId);
ResultSet rs = ps.executeQuery();
%>

<!DOCTYPE html>
<html>
<head>
    <title>Smart Schedule</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="schedule-page">

    <div class="floating-panel">

        <div class="schedule-head">
            <h1>Your Schedule</h1>
            <p>Balanced study plan with college, meals and breaks</p>
            <a href="generatePlan.jsp">Regenerate</a>
        </div>

        <div class="schedule-list">

        <%
        boolean hasData = false;

        while(rs.next()) {
            hasData = true;

            String type = rs.getString("task_type");
            String cardClass = "study-event";
            String title = rs.getString("subject_name");

            if(type.equals("Break")){
                cardClass = "break-event";
                title = "Short Refresh Break";
            } else if(type.equals("College")){
                cardClass = "college-event";
                title = "College Time";
            } else if(type.equals("Breakfast")){
                cardClass = "meal-event";
                title = "Breakfast Break";
            } else if(type.equals("Lunch")){
                cardClass = "meal-event";
                title = "Lunch Break";
            } else if(type.equals("Dinner")){
                cardClass = "meal-event";
                title = "Dinner Break";
            }

            String start = rs.getTime("start_time").toString().substring(0,5);
            String end = rs.getTime("end_time").toString().substring(0,5);
        %>

            <div class="schedule-row">
                <div class="day-dot"></div>

                <div class="event-time">
                    <%= start %><br>
                    <span><%= end %></span>
                </div>

                <div class="event-card <%= cardClass %>">
                    <div>
                        <h2><%= title %></h2>
                        <p><%= type %> • <%= start %> - <%= end %></p>

                        <% if(type.equals("Study")) { %>
                            <span class="badge <%= rs.getString("priority").toLowerCase() %>">
                                <%= rs.getString("priority") %>
                            </span>
                            <span class="status"><%= rs.getString("status") %></span>
                        <% } %>
                    </div>

                    <% if(type.equals("Study") && !rs.getString("status").equals("Completed")) { %>
                        <a class="mini-complete" href="updateStatus.jsp?id=<%= rs.getInt("plan_id") %>">Done</a>
                    <% } %>
                </div>
            </div>

        <% } %>

        <% if(!hasData) { %>
            <div class="empty-plan">
                <h2>No schedule generated</h2>
                <p>Generate your smart study plan first.</p>
                <a href="generatePlan.jsp" class="btn">Generate Plan</a>
            </div>
        <% } %>

        </div>
    </div>

</div>

</body>
</html>
