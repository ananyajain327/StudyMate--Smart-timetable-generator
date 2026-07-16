<%@ include file="db.jsp" %>
<%@ page contentType="text/html;charset=UTF-8" %>

<%
if(request.getParameter("register") != null) {
    String name = request.getParameter("name");
    String email = request.getParameter("email");
    String pass = request.getParameter("password");

    PreparedStatement ps = con.prepareStatement(
        "INSERT INTO users(name,email,password) VALUES(?,?,?)"
    );
    ps.setString(1, name);
    ps.setString(2, email);
    ps.setString(3, pass);

    ps.executeUpdate();
    response.sendRedirect("login.jsp");
}
%>

<!DOCTYPE html>
<html>
<head>
    <title>Register</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<div class="auth-container">
    <div class="auth-card">
        <h1>Create Account</h1>
        <p>Start planning your studies smartly</p>

        <form method="post">
            <input type="text" name="name" placeholder="Full Name" required>
            <input type="email" name="email" placeholder="Email Address" required>
            <input type="password" name="password" placeholder="Password" required>
            <button type="submit" name="register">Register</button>
        </form>

        <p>Already have account? <a href="login.jsp">Login</a></p>
    </div>
</div>

</body>
</html>