<%@ include file="db.jsp" %>
<%@ page contentType="text/html;charset=UTF-8" %>
<%
if(session.getAttribute("user_id") == null) {
    response.sendRedirect("login.jsp");
}

int id = Integer.parseInt(request.getParameter("id"));

PreparedStatement ps = con.prepareStatement(
    "UPDATE study_plan SET status='Completed' WHERE plan_id=?"
);
ps.setInt(1, id);
ps.executeUpdate();

response.sendRedirect("viewPlan.jsp");
%>