#!/bin/bash
set -e

# Ensure MySQL data directory exists
mkdir -p /var/lib/mysql
chown -R mysql:mysql /var/lib/mysql

# Start MariaDB
service mariadb start || service mysql start

# Wait for MariaDB to be ready
for i in $(seq 1 30); do
    if mysqladmin ping --silent; then break; fi
    sleep 1
done

# Create the app database and a dedicated app user
mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS study_planner;
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'app_pass_123';
GRANT ALL PRIVILEGES ON study_planner.* TO 'app'@'%';
FLUSH PRIVILEGES;
SQL

# Seed the schema (idempotent)
mysql -uroot study_planner < /init.sql

# Start Tomcat (foreground)
exec catalina.sh run
