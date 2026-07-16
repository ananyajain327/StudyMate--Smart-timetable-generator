<%@ include file="db.jsp" %>
<%@ page contentType="text/html;charset=UTF-8" %>
<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
}

int userId = (Integer)session.getAttribute("user_id");

if(request.getParameter("add") != null) {
    String subject = request.getParameter("subject_name");
    String priority = request.getParameter("priority");
    String examDate = request.getParameter("exam_date");

    PreparedStatement ps = con.prepareStatement(
        "INSERT INTO subjects(user_id, subject_name, priority, exam_date) VALUES(?,?,?,?)"
    );
    ps.setInt(1, userId);
    ps.setString(2, subject);
    ps.setString(3, priority);
    ps.setString(4, examDate);

    ps.executeUpdate();
    response.sendRedirect("viewSubjects.jsp");
}
%>

<!DOCTYPE html>
<html>
<head>
    <title>Add Subject</title>
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
            <h1>Add Subject</h1>
            <p>Add subject details for your study planner.</p>
        </div>

        <div class="table-box">
            <form method="post">
                <input type="text" name="subject_name" placeholder="Subject Name" required>

                <select name="priority" required>
                    <option value="">Select Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>

                <input type="date" name="exam_date" required>

                <button type="submit" name="add">Add Subject</button>
            </form>
        </div>
    </div>

</div>

</body>
</html>