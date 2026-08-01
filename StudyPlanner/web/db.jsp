<%@ page import="java.sql.*" %>
<%
String dbUrl = System.getenv("DB_URL");
if (dbUrl == null) dbUrl = "jdbc:mysql://localhost:3306/study_planner?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
String dbUser = System.getenv("DB_USER");
if (dbUser == null) dbUser = "root";
String dbPassword = System.getenv("DB_PASSWORD");
if (dbPassword == null) dbPassword = "";

Connection con = null;

try {
    Class.forName("com.mysql.cj.jdbc.Driver");

    con = DriverManager.getConnection(dbUrl, dbUser, dbPassword);

} catch(Exception e) {
    application.log("DB Connection Error", e);
}
%>