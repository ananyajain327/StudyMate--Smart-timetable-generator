# ---------- Build stage: package the JSP application into a WAR ----------
FROM tomcat:9

# MariaDB + tools for packaging
RUN apt-get update \
 && apt-get install -y --no-install-recommends mariadb-server mariadb-client curl \
 && rm -rf /var/lib/apt/lists/*

# Copy web content and add the MySQL JDBC driver
RUN mkdir -p /tmp/web/WEB-INF/lib
COPY StudyPlanner/web /tmp/web/
RUN curl -fsSL -o /tmp/web/WEB-INF/lib/mysql-connector.jar https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar \
 && cd /tmp/web && jar -cf /usr/local/tomcat/webapps/ROOT.war .

COPY database.sql /init.sql
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# App database configuration (override these in your platform env if needed)
ENV DB_USER=app \
    DB_PASSWORD=app_pass_123 \
    DB_URL="jdbc:mysql://127.0.0.1:3306/study_planner?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
