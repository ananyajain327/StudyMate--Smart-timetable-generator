<%@ page import="java.sql.*" %>
<%@ page import="java.time.*" %>
<%@ page import="java.util.*" %>
<%@ include file="db.jsp" %>

<%
if(session.getAttribute("user_id") == null){
    response.sendRedirect("login.jsp");
    return;
}

int userId = (Integer)session.getAttribute("user_id");

if(request.getParameter("generate") != null){

    LocalTime wake = LocalTime.parse(request.getParameter("wake_time"));
    LocalTime sleep = LocalTime.parse(request.getParameter("sleep_time"));
    LocalTime collegeStart = LocalTime.parse(request.getParameter("college_start"));
    LocalTime collegeEnd = LocalTime.parse(request.getParameter("college_end"));

    LocalTime breakfast = LocalTime.parse(request.getParameter("breakfast_time"));
    LocalTime lunch = LocalTime.parse(request.getParameter("lunch_time"));
    LocalTime dinner = LocalTime.parse(request.getParameter("dinner_time"));

    int sessionMin = Integer.parseInt(request.getParameter("session_duration"));
    int shortBreakMin = Integer.parseInt(request.getParameter("break_duration"));
    int maxStudyHours = Integer.parseInt(request.getParameter("max_study_hours"));
    int totalStudyMinutesAllowed = maxStudyHours * 60;
    int studiedMinutes = 0;

    PreparedStatement del = con.prepareStatement("DELETE FROM study_plan WHERE user_id=?");
    del.setInt(1, userId);
    del.executeUpdate();

    java.sql.Date today = new java.sql.Date(System.currentTimeMillis());

    PreparedStatement subPs = con.prepareStatement(
        "SELECT * FROM subjects WHERE user_id=? ORDER BY FIELD(priority,'High','Medium','Low')"
    );
    subPs.setInt(1, userId);
    ResultSet subjects = subPs.executeQuery();

    ArrayList<Integer> subjectIds = new ArrayList<Integer>();

    while(subjects.next()){
        subjectIds.add(subjects.getInt("subject_id"));
    }

    if(subjectIds.size() == 0){
        out.println("<script>alert('Please add subjects first'); window.location='addSubject.jsp';</script>");
        return;
    }

    int defaultSubjectId = subjectIds.get(0);

    PreparedStatement fixed = con.prepareStatement(
        "INSERT INTO study_plan(user_id, subject_id, study_date, start_time, end_time, hours, status, task_type) VALUES(?,?,?,?,?,?,?,?)"
    );

    fixed.setInt(1, userId);
    fixed.setInt(2, defaultSubjectId);
    fixed.setDate(3, today);
    fixed.setTime(4, java.sql.Time.valueOf(breakfast));
    fixed.setTime(5, java.sql.Time.valueOf(breakfast.plusMinutes(30)));
    fixed.setInt(6, 0);
    fixed.setString(7, "Breakfast");
    fixed.setString(8, "Breakfast");
    fixed.executeUpdate();

    fixed.setInt(1, userId);
    fixed.setInt(2, defaultSubjectId);
    fixed.setDate(3, today);
    fixed.setTime(4, java.sql.Time.valueOf(lunch));
    fixed.setTime(5, java.sql.Time.valueOf(lunch.plusMinutes(45)));
    fixed.setInt(6, 0);
    fixed.setString(7, "Lunch");
    fixed.setString(8, "Lunch");
    fixed.executeUpdate();

    fixed.setInt(1, userId);
    fixed.setInt(2, defaultSubjectId);
    fixed.setDate(3, today);
    fixed.setTime(4, java.sql.Time.valueOf(dinner));
    fixed.setTime(5, java.sql.Time.valueOf(dinner.plusMinutes(45)));
    fixed.setInt(6, 0);
    fixed.setString(7, "Dinner");
    fixed.setString(8, "Dinner");
    fixed.executeUpdate();

    fixed.setInt(1, userId);
    fixed.setInt(2, defaultSubjectId);
    fixed.setDate(3, today);
    fixed.setTime(4, java.sql.Time.valueOf(collegeStart));
    fixed.setTime(5, java.sql.Time.valueOf(collegeEnd));
    fixed.setInt(6, 0);
    fixed.setString(7, "College");
    fixed.setString(8, "College");
    fixed.executeUpdate();

    int index = 0;
    LocalTime current = wake;

    while(current.plusMinutes(30).isBefore(sleep) && studiedMinutes < totalStudyMinutesAllowed){

        if(!current.isBefore(collegeStart) && current.isBefore(collegeEnd)){
            current = collegeEnd;
            continue;
        }

        if(!current.isBefore(breakfast) && current.isBefore(breakfast.plusMinutes(30))){
            current = breakfast.plusMinutes(30);
            continue;
        }

        if(!current.isBefore(lunch) && current.isBefore(lunch.plusMinutes(45))){
            current = lunch.plusMinutes(45);
            continue;
        }

        if(!current.isBefore(dinner) && current.isBefore(dinner.plusMinutes(45))){
            current = dinner.plusMinutes(45);
            continue;
        }

        int remainingStudy = totalStudyMinutesAllowed - studiedMinutes;
        int actualSession = sessionMin;

        if(actualSession > remainingStudy){
            actualSession = remainingStudy;
        }

        LocalTime end = current.plusMinutes(actualSession);

        if(end.isAfter(sleep)){
            break;
        }

        if(current.isBefore(collegeStart) && end.isAfter(collegeStart)){
            end = collegeStart;
        }

        if(current.isBefore(breakfast) && end.isAfter(breakfast)){
            end = breakfast;
        }

        if(current.isBefore(lunch) && end.isAfter(lunch)){
            end = lunch;
        }

        if(current.isBefore(dinner) && end.isAfter(dinner)){
            end = dinner;
        }

        int duration = (int)Duration.between(current, end).toMinutes();

        if(duration >= 30){
            int subjectId = subjectIds.get(index % subjectIds.size());

            PreparedStatement ins = con.prepareStatement(
                "INSERT INTO study_plan(user_id, subject_id, study_date, start_time, end_time, hours, status, task_type) VALUES(?,?,?,?,?,?,?,?)"
            );
            ins.setInt(1, userId);
            ins.setInt(2, subjectId);
            ins.setDate(3, today);
            ins.setTime(4, java.sql.Time.valueOf(current));
            ins.setTime(5, java.sql.Time.valueOf(end));
            ins.setInt(6, duration / 60);
            ins.setString(7, "Pending");
            ins.setString(8, "Study");
            ins.executeUpdate();

            studiedMinutes += duration;
            index++;
            current = end;

            if(studiedMinutes < totalStudyMinutesAllowed && current.plusMinutes(shortBreakMin).isBefore(sleep)){
                LocalTime breakEnd = current.plusMinutes(shortBreakMin);

                PreparedStatement br = con.prepareStatement(
                    "INSERT INTO study_plan(user_id, subject_id, study_date, start_time, end_time, hours, status, task_type) VALUES(?,?,?,?,?,?,?,?)"
                );
                br.setInt(1, userId);
                br.setInt(2, defaultSubjectId);
                br.setDate(3, today);
                br.setTime(4, java.sql.Time.valueOf(current));
                br.setTime(5, java.sql.Time.valueOf(breakEnd));
                br.setInt(6, 0);
                br.setString(7, "Break");
                br.setString(8, "Break");
                br.executeUpdate();

                current = breakEnd;
            }

        } else {
            current = current.plusMinutes(15);
        }
    }

    response.sendRedirect("viewPlan.jsp");
}
%>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Generate Smart Plan</title>
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

        <div class="planner-hero">
            <div>
                <h1>Smart Study Planner</h1>
                
            </div>
        </div>

        <div class="form-title">
            <h2>Create Your Daily Routine</h2>
            <p>Fill these details and StudyMate will divide your free time smartly.</p>
        </div>

        <div class="table-box generate-box">
            <form method="post" class="smart-form">

                <div class="form-group">
                    <label>Wake Up Time</label>
                    <input type="time" name="wake_time" value="06:30" required>
                </div>

                <div class="form-group">
                    <label>Sleep Time</label>
                    <input type="time" name="sleep_time" value="23:00" required>
                </div>

                <div class="form-group">
                    <label>College Start Time</label>
                    <input type="time" name="college_start" value="09:00" required>
                </div>

                <div class="form-group">
                    <label>College End Time</label>
                    <input type="time" name="college_end" value="16:00" required>
                </div>

                <div class="form-group">
                    <label>Breakfast Time</label>
                    <input type="time" name="breakfast_time" value="08:00" required>
                </div>

                <div class="form-group">
                    <label>Lunch Time</label>
                    <input type="time" name="lunch_time" value="13:00" required>
                </div>

                <div class="form-group">
                    <label>Dinner Time</label>
                    <input type="time" name="dinner_time" value="20:00" required>
                </div>

                <div class="form-group">
                    <label>Max Study Hours Per Day</label>
                    <select name="max_study_hours" required>
                        <option value="2">2 Hours</option>
                        <option value="3">3 Hours</option>
                        <option value="4" selected>4 Hours</option>
                        <option value="5">5 Hours</option>
                        <option value="6">6 Hours</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Study Session Duration</label>
                    <select name="session_duration">
                        <option value="45">45 Minutes</option>
                        <option value="60" selected>60 Minutes</option>
                        <option value="90">90 Minutes</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Short Break After Study</label>
                    <select name="break_duration">
                        <option value="10">10 Minutes</option>
                        <option value="15" selected>15 Minutes</option>
                        <option value="20">20 Minutes</option>
                    </select>
                </div>

                <button type="submit" name="generate">Generate Smart Schedule</button>

            </form>
        </div>

    </div>
</div>

</body>
</html>