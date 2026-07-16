<%@ include file="db.jsp" %>
<%@ page contentType="text/html;charset=UTF-8" %>
<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
}

int id = Integer.parseInt(request.getParameter("id"));

PreparedStatement ps1 = con.prepareStatement("DELETE FROM study_plan WHERE subject_id=?");
ps1.setInt(1, id);
ps1.executeUpdate();

PreparedStatement ps2 = con.prepareStatement("DELETE FROM subjects WHERE subject_id=?");
ps2.setInt(1, id);
ps2.executeUpdate();

response.sendRedirect("viewSubjects.jsp");
%>