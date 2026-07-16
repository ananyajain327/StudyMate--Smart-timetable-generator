<%@ include file="db.jsp" %>
<%@ page contentType="text/html;charset=UTF-8" %>

<%
if(request.getParameter("login") != null) {
    String email = request.getParameter("email");
    String pass = request.getParameter("password");

    PreparedStatement ps = con.prepareStatement(
        "SELECT * FROM users WHERE email=? AND password=?"
    );
    ps.setString(1, email);
    ps.setString(2, pass);

    ResultSet rs = ps.executeQuery();

    if(rs.next()) {
        session.setAttribute("user_id", rs.getInt("user_id"));
        session.setAttribute("name", rs.getString("name"));
        response.sendRedirect("dashboard.jsp");
    } else {
        out.println("<script>alert('Invalid Email or Password');</script>");
    }
}
%>

<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="auth-container">
    <div class="auth-card">
        <h1>Welcome Back</h1>
        <p>Login to continue your study plan</p>

        <form method="post">
            <input type="email" name="email" placeholder="Email Address" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit" name="login">Login</button>
        </form>

        <p>New user? <a href="register.jsp">Register</a></p>
    </div>
</div>

</body>
</html>