<div align="center">

<img src="https://raw.githubusercontent.com/ananyajain327/StudyMate--Smart-timetable-generator/main/StudyPlanner/web/images/study-bg.jpeg" alt="StudyMate Banner" width="100%"/>

# 📚 StudyMate — Smart Timetable Generator

**Study smarter, not harder** — automatically generate personalised academic timetables in seconds.

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)
[![JSP](https://img.shields.io/badge/JSP-Java%20EE-007396?style=for-the-badge&logo=java&logoColor=white)]()
[![JDBC](https://img.shields.io/badge/JDBC-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![GlassFish](https://img.shields.io/badge/GlassFish-Server-007396?style=for-the-badge&logo=java&logoColor=white)]()
[![NetBeans](https://img.shields.io/badge/NetBeans-IDE-1B6AC6?style=for-the-badge&logo=apachenetbeanside&logoColor=white)](https://netbeans.apache.org/)

[![Stars](https://img.shields.io/github/stars/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&logo=github&color=yellow)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator)
[![Forks](https://img.shields.io/github/forks/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&logo=github&color=blue)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/forks)
[![Open Issues](https://img.shields.io/github/issues/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&logo=github&color=red)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/issues)
[![License](https://img.shields.io/github/license/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=green)](./LICENSE)

[![Last Commit](https://img.shields.io/github/last-commit/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=purple)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=orange)]()
[![Top Language](https://img.shields.io/github/languages/top/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=brightgreen)]()

</div>

---

## 📖 About the Project

**StudyMate** is a Java-based **Smart Timetable Generator** that simplifies academic schedule management. Students add their subjects with priorities and exam dates, and StudyMate automatically builds a balanced study plan — distributing hours intelligently so every subject gets the attention it needs before the exam.

> 🎯 **Project Objective:** Automate timetable creation, manage subjects and schedules, and eliminate the manual effort involved in generating academic timetables.

---

## ✨ Features

### 👤 User Management
- ✅ Quick user **registration** & **login**
- 🔐 Session-managed personalised dashboard

### 📚 Subject Management
- ➕ Add subjects with **priority** (`High` / `Medium` / `Low`)
- 📅 Set **exam dates** for each subject
- ✏️ **Edit** & 🗑️ **Delete** subjects anytime
- 📋 Smart ordering by priority and nearest exam date

### 🧠 Smart Plan Generation
- ⚙️ Configurable **max study hours**, **session duration** & **break duration**
- 🗓️ Auto-generated study plan prioritising urgent subjects
- ⏰ Daily schedule with **start time**, **end time** & **task type**
- ✔️ Mark tasks **Completed** / **Pending**
- 📊 Dashboard stats — total subjects, pending & completed tasks
- 🌅 **Today's Plan** view for a quick daily checklist

### 🗄️ Database & Architecture
- 🧱 JSP + JDBC + MySQL stack
- 🔒 Prepared statements to prevent **SQL Injection**
- 📈 Normalised relational schema (`users` → `subjects` → `study_plan`)

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | HTML5, CSS3, JSP                     |
| Backend    | Java (JDK 8+), Java EE, JDBC         |
| Database   | MySQL 8.x                            |
| Server     | GlassFish 5.x / Apache Tomcat        |
| Build Tool | Apache Ant (NetBeans)                |
| IDE        | Apache NetBeans                      |
| Connector  | `mysql-connector-j` 8.0.33           |

---

## 🚀 Getting Started

### ✅ Prerequisites
- [JDK 8 or higher](https://www.oracle.com/java/technologies/downloads/)
- [Apache NetBeans IDE](https://netbeans.apache.org/download/index.html)
- [GlassFish 5+](https://glassfish.org/) or Apache Tomcat
- [MySQL Server 8.x](https://dev.mysql.com/downloads/mysql/) + MySQL Workbench

### 📦 Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/ananyajain327/StudyMate--Smart-timetable-generator.git
   cd StudyMate--Smart-timetable-generator/StudyPlanner
   ```

2. **Create the database** — open MySQL Workbench and run:
   ```sql
   CREATE DATABASE study_planner;
   USE study_planner;

   CREATE TABLE users (
       user_id INT AUTO_INCREMENT PRIMARY KEY,
       name    VARCHAR(100) NOT NULL,
       email   VARCHAR(100) NOT NULL UNIQUE,
       password VARCHAR(100) NOT NULL
   );

   CREATE TABLE subjects (
       subject_id   INT AUTO_INCREMENT PRIMARY KEY,
       user_id      INT NOT NULL,
       subject_name VARCHAR(100) NOT NULL,
       priority     VARCHAR(20) NOT NULL,
       exam_date    DATE,
       FOREIGN KEY (user_id) REFERENCES users(user_id)
   );

   CREATE TABLE study_plan (
       plan_id     INT AUTO_INCREMENT PRIMARY KEY,
       user_id     INT NOT NULL,
       subject_id  INT NOT NULL,
       study_date  DATE NOT NULL,
       start_time  TIME NOT NULL,
       end_time    TIME NOT NULL,
       hours       INT NOT NULL,
       status      VARCHAR(20) DEFAULT 'Pending',
       task_type   VARCHAR(50),
       FOREIGN KEY (user_id)    REFERENCES users(user_id),
       FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
   );
   ```

3. **Configure DB credentials** — edit `web/db.jsp` and set your local username/password (or export `DB_USER` / `DB_PASSWORD` environment variables).

4. **Run the project**
   - Open the `StudyPlanner` folder in NetBeans
   - Clean & Build (**Shift+F11**)
   - Deploy to GlassFish and press **▶ Run**
   - Visit 👉 `http://localhost:8080/StudyPlanner/`

---

## 🗄️ Database Schema

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│    users     │      │  subjects    │      │    study_plan    │
├──────────────┤      ├──────────────┤      ├──────────────────┤
│ user_id    PK│◄────►│ user_id    FK│◄────►│ user_id        FK│
│ name         │      │ subject_id PK│      │ subject_id     FK│
│ email        │      │ subject_name │      │ study_date       │
│ password     │      │ priority     │      │ start_time       │
└──────────────┘      │ exam_date    │      │ end_time         │
                      └──────────────┘      │ hours            │
                                            │ status           │
                                            │ task_type        │
                                            └──────────────────┘
```

---

## 📁 Project Structure

```
StudyPlanner/
├── web/
│   ├── index.jsp            # Landing page
│   ├── register.jsp         # User signup
│   ├── login.jsp            # User login
│   ├── profile.jsp          # User profile
│   ├── dashboard.jsp        # Dashboard with stats
│   ├── addSubject.jsp       # Add subject
│   ├── viewSubjects.jsp     # List subjects
│   ├── editSubject.jsp      # Edit subject
│   ├── deleteSubject.jsp    # Delete subject
│   ├── generatePlan.jsp     # Auto-generate timetable
│   ├── viewPlan.jsp         # Full study plan
│   ├── todayPlan.jsp        # Today's tasks
│   ├── updateStatus.jsp     # Mark tasks complete
│   ├── logout.jsp           # Logout
│   ├── db.jsp               # JDBC connection helper
│   ├── css/style.css        # Stylesheet
│   └── images/              # Assets
├── nbproject/               # NetBeans project files
└── build.xml                # Ant build script
```

---

## 📸 Screenshots

> 📝 *Screenshots coming soon — add your app screenshots in the `web/images` folder and update this section.*

---

## 🗺️ Roadmap

- [x] User registration & login
- [x] Subject management with priorities
- [x] Automatic timetable generation
- [x] Completion tracking
- [ ] Weekly plan view
- [ ] Email / push reminders
- [ ] Study progress analytics
- [ ] Mobile-friendly responsive UI

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!
Feel free to check the [issues page](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/issues) and open a PR.

Please read the [Contributing Guidelines](./CONTRIBUTING.md) first.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## 👤 Author

**Ananya Jain**
- 🔗 [LinkedIn](https://www.linkedin.com/in/ananya-jain327)
- 🐙 [GitHub](https://github.com/ananyajain327)

---

<div align="center">

⭐ **If you find this project helpful, give it a star!** ⭐

</div>
