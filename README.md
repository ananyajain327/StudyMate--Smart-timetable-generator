# 📚 StudyMate — Smart Timetable Generator

**Study smarter, not harder** — automatically generate personalised academic timetables from your subjects, priorities & exam dates.

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.java.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Stars](https://img.shields.io/github/stars/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&logo=github&color=yellow)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator)
[![Forks](https://img.shields.io/github/forks/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&logo=github&color=blue)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/forks)
[![License](https://img.shields.io/github/license/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=green)](./LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/ananyajain327/StudyMate--Smart-timetable-generator?style=for-the-badge&color=purple)](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/commits/main)

---

## 📖 About

StudyMate is a Java-based smart timetable generator that simplifies academic schedule management. Students add their subjects with priorities and exam dates, and StudyMate automatically builds a balanced study plan — distributing hours intelligently so every subject gets enough time before the exam.

---

## ✨ Features

- User registration & login
- Add / edit / delete subjects with priority (High / Medium / Low) & exam dates
- Automatic timetable generation with configurable study hours
- Today's plan view & task completion tracking
- Dashboard with statistics (subjects, pending & completed tasks)

---

## 🛠️ Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | HTML, CSS, JSP              |
| Backend    | Java, JSP, JDBC             |
| Database   | MySQL                       |
| Server     | GlassFish / Apache Tomcat   |
| IDE        | Apache NetBeans             |

---

## 🚀 Getting Started

### Prerequisites
- JDK 8+
- Apache NetBeans IDE
- GlassFish 5+ or Apache Tomcat
- MySQL Server 8.x

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ananyajain327/StudyMate--Smart-timetable-generator.git
   cd StudyMate--Smart-timetable-generator/StudyPlanner
   ```
2. Import the database by running [`database.sql`](./database.sql) in MySQL Workbench.
3. Set your MySQL username/password in `web/db.jsp` (or export `DB_USER` / `DB_PASSWORD` environment variables).
4. Open the project in NetBeans, clean & build, then deploy to GlassFish and run.
5. Visit `http://localhost:8080/StudyPlanner/`

---

## 🤝 Contributing

Contributions are welcome! Open an [issue](https://github.com/ananyajain327/StudyMate--Smart-timetable-generator/issues) or submit a pull request. Please read the [Contributing Guidelines](./CONTRIBUTING.md).

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE).

---

## 👤 Author

**Ananya Jain** — [LinkedIn](https://www.linkedin.com/in/ananya-jain327) · [GitHub](https://github.com/ananyajain327)

---

<div align="center">⭐ If you find this project helpful, give it a star!</div>
