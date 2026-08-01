# ---------- Build stage: package the JSP application into a WAR ----------
FROM tomcat:9

# MariaDB + tools for packaging
RUN apt-get update \
 && apt-get install -y --no-install-recommends mariadb-server mariadb-client curl openssl \
 && rm -rf /var/lib/apt/lists/*

# Copy web content and add the MySQL JDBC driver
RUN mkdir -p /tmp/web/WEB-INF/lib
COPY StudyPlanner/web /tmp/web/

# Compile Java classes (password hashing) into the WAR
COPY StudyPlanner/src/java /tmp/src/java
RUN mkdir -p /tmp/web/WEB-INF/classes \
 && javac -encoding UTF-8 -d /tmp/web/WEB-INF/classes $(find /tmp/src/java -name "*.java")

RUN curl -fsSL -o /tmp/web/WEB-INF/lib/mysql-connector.jar https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.0.33/mysql-connector-j-8.0.33.jar \
 && cd /tmp/web && jar -cf /usr/local/tomcat/webapps/ROOT.war .

COPY database.sql /init.sql
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# App database configuration. DB_PASSWORD has no committed default:
# it is auto-generated at container start unless DB_PASSWORD is set.
# When overriding DB_NAME, also update DB_URL accordingly.
ENV DB_USER=app \
    DB_NAME=study_planner \
    DB_URL="jdbc:mysql://127.0.0.1:3306/study_planner?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"

EXPOSE 8080

CMD ["/usr/local/bin/start.sh"]
