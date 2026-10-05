CREATE DATABASE IF NOT EXISTS study_planner;
USE study_planner;

CREATE TABLE IF NOT EXISTS users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL,
    chronotype  VARCHAR(30) DEFAULT 'moderate',
    wake_time   TIME DEFAULT '07:30:00',
    sleep_time  TIME DEFAULT '23:30:00'
);

CREATE TABLE IF NOT EXISTS subjects (
    subject_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    priority     VARCHAR(20) NOT NULL,
    exam_date    DATE,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS study_plan (
    plan_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    subject_id     INT NOT NULL,
    study_date     DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    hours          INT NOT NULL,
    status         VARCHAR(20) DEFAULT 'Pending',
    task_type      VARCHAR(50),
    energy_level   VARCHAR(30) DEFAULT 'deep', -- 'deep' | 'shallow' | 'review'
    is_locked      BOOLEAN DEFAULT FALSE,
    chunk_index    INT DEFAULT 1,
    total_chunks   INT DEFAULT 1,
    buffer_minutes INT DEFAULT 15,
    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);
