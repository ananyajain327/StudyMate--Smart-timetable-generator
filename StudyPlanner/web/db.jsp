<%@ page import="java.sql.*" %>
<%
Connection con = null;

try {
    Class.forName("com.mysql.cj.jdbc.Driver");

    con = DriverManager.getConnection(
        "jdbc:mysql://localhost:3306/study_planner?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
        "root",
        "Ananyajain@327"
    );

} catch(Exception e) {
    out.println("<h3 style='color:red'>DB Connection Error: " + e.getMessage() + "</h3>");
}
%>