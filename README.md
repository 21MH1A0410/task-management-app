# TaskManager — Stay Organized, Get Things Done

A full-stack task management application built with heart. It helps you keep track of your daily tasks with a clean, intuitive interface while offering the robust security and performance features expected from a modern productivity tool.

---

## ✨ What Makes It Special?

- **Secure by Design**: Your session is protected using HttpOnly cookies, JWT with token versioning, and rate-limited authentication endpoints.
- **Optimistic UI**: Experience the speed. Create, update, or delete a task and see the change immediately—if something fails, the UI rolls back gracefully.
- **Smart Filtering**: Filter by status, search by title, or sort by what matters most. All your filter states stay in the URL, making them easy to bookmark and share.
- **Soft Delete with a Safety Net**: Don't worry about accidental clicks. Deleted tasks can be restored within 7 days before being permanently cleared via a MongoDB TTL index.
- **Professional Profiles**: Upload and crop your profile picture directly in the browser. Imagery is processed for performance and stored securely as a Buffer.
- **Always Polished**: A responsive, mobile-first design built with Tailwind CSS that feels great on any device.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite)** for a lightning-fast developer experience.
- **Tailwind CSS** for a modern, fluid design system.
- **React Hook Form + Zod** for robust, type-safe form handling.
- **React Router** for seamless, URL-driven navigation.
- **Headless UI** for accessible, unstyled interactive components.

### Backend
- **Node.js & Express** providing a solid, scalable API foundation.
- **MongoDB + Mongoose** for flexible data persistence with TTL support.
- **JWT (HttpOnly cookies)** for enterprise-grade, XSS-resistant authentication.
- **Sharp** for high-performance image processing and resizing.
- **Pino** for structured, high-throughput logging.
- **Security Hardening**: Integrated with Helmet, CORS, and NoSQL injection protection.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/task-management-app.git
cd task-management-app

# Install Backend
cd server
npm install

# Install Frontend
cd ../client
npm install
```

### 2. Environment Variables
Create a `.env` file in the `server/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_32_character_secret_key
ALLOW_ORIGINS=http://localhost:5173
```

Create a `.env` file in the `client/` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the App
**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Building for Production

### Backend
The backend is Docker-ready. Use the provided Dockerfile for deployment:
```bash
cd server
docker build -t taskmanager-api .
```

### Frontend
Generate the static production build:
```bash
cd client
npm run build
```

---

## 📚 API Overview (At a Glance)

### Auth
- `POST /api/users` — Register account
- `POST /api/users/login` — Sign in
- `POST /api/users/logout` — Sign out

### Tasks
- `GET /api/tasks` — List (Paginated, Searchable)
- `POST /api/tasks` — Create
- `PATCH /api/tasks/:id` — Update
- `DELETE /api/tasks/:id` — Soft Delete
- `PATCH /api/tasks/:id/restore` — Restore

---

## 📁 Project Structure

```text
task-management-app/
├── client/              # React frontend application
│   ├── src/components/  # UI components
│   ├── src/pages/       # Page views
│   └── src/context/     # State management (Auth/Tasks)
├── server/              # Node.js Express API
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & Security
│   └── models/          # Data schemas
└── README.md            # You are here!
```

---

## 🧠 Key Design Decisions

- **HttpOnly Cookies**: We chose cookie-based JWTs to prevent XSS-based token theft. JavaScript literally cannot see your token.
- **Token Versioning**: By adding a version number to tokens, we can invalidate all active sessions instantly when a user changes their password.
- **Soft Deletion**: Instead of losing data forever, tasks are "hidden" and scheduled for hard deletion 7 days later using MongoDB’s native TTL indices.
- **Aggressive Image Processing**: Profile pictures are resized and converted to JPEG server-side using Sharp, ensuring high performance and consistent storage.

---

## 🤝 Contributing

This is a personal project, but I welcome feedback and suggestions! Feel free to open an issue or submit a pull request if you see something that could be improved.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

**Crafted with care by Rama Raju**
