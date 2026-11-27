# 🚀 TaskFlow Workspace V2 (Task Management System)

> TaskFlow is a modern, high-performance, and responsive task management web application designed to help users efficiently organize, track, and complete daily and professional tasks with a sleek glassmorphism UI aesthetic.

---

## ✨ Key Features

* **Secure Authentication**: JWT (JSON Web Token) based Login and Registration supporting role-based access control (*User* & *Admin*).
* **Flexible Task Management**: Create, update, delete, and track task statuses (`TODO`, `IN_PROGRESS`, `DONE`) alongside priority levels (`LOW`, `MEDIUM`, `HIGH`).
* **Inline Custom Categories**: Users can dynamically create personal categories directly inside the task modal for seamless task organization and filtering.
* **Dashboard & Analytics**: Concise data visualizer showcasing task progress and completion statistics.
* **Admin Panel**: System overview, user management, and global task monitoring tools for administrators.
* **Modern UI/UX**: Built with a clean dark-themed collapsible navigation sidebar, window-control accents, and smooth aurora gradient effects using **Tailwind CSS**.

---

## 🛠️ Tech Stack

### Frontend:
* **React.js** (Vite)
* **Tailwind CSS** (Styling & Glassmorphism)
* **Lucide React** (Modern Icons)
* **React Hot Toast** (Interactive Notifications)
* **React Router DOM** (Client-side Routing)

### Backend:
* **Go (Golang)**
* **Gin Framework** (REST API)
* **MySQL** (Database)
* **GORM / Database Driver**

---

## 📂 Project Directory Structure

```text
task-management/
│
├── backend/               # Go source code (API controllers, models, routes, handlers)
│   ├── cmd/
│   ├── internal/
│   └── routes/
│
└── frontend/              # React source code (Vite)
    ├── public/
    └── src/
        ├── assets/        # Logos and visual images
        ├── components/    # Layouts, navigation sidebars, and wrappers
        ├── pages/         # User and Admin views/pages
        └── services/      # API communication service layer