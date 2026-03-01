# TaskManager — Stay Organized, Get Things Done

A full-stack task management application built with heart. It helps you keep track of your daily tasks with a clean, intuitive interface while offering the robust security and performance features you’d expect from a modern productivity tool.

---

## ✨ What Makes It Special?

- **Secure by Design**: Your session is protected using HttpOnly cookies, JWT with token versioning (instant invalidation on password change), and rate-limited authentication endpoints. No token theft via XSS.
- **Optimistic UI**: Experience the speed. Create, update, or delete a task and see the change immediately. If something fails, the UI rolls back gracefully – all powered by a custom `useTasks` hook.
- **Smart Filtering & Sorting**: Filter by status, search by title, or sort by newest, oldest, or due date. All your filter states live in the URL, so you can bookmark or share your view, and the back button just works.
- **Pagination That Just Works**: 12 tasks per page. Delete the last task on a page? We automatically take you back one page – no empty pages.
- **Soft Delete with a Safety Net**: Delete a task by accident? You have 7 days to restore it. After that, a MongoDB TTL index permanently removes it, giving you peace of mind without manual cleanup.
- **Profile Pictures with Cropping**: Upload an image, crop it to a perfect circle, and we resize it to 200×200 JPEG on the server using Sharp. A cache-busting timestamp ensures you see the new picture instantly.
- **Always Polished**: A responsive, mobile-first design built with Tailwind CSS that feels great on any device, with smooth animations and thoughtful micro-interactions throughout.
- **Progress Overview**: At a glance, see how many tasks are pending, in progress, or completed. Click any segment to filter by that status – it’s like a tiny dashboard.

---

## 🛠️ Tech Stack

### Frontend
- **React 18 + Vite**: Fast development and hot module replacement.
- **React Router v6 & Suspense**: URL-driven navigation and lazy-loaded code-splitting.
- **Tailwind CSS + Headless UI**: Modern, responsive styling with accessible components.
- **React Hook Form + Zod**: Type-safe form handling and validation (schemas shared with backend).
- **React Helmet Async**: Dynamic HEAD tag manipulation for built-in SEO.
- **React Easy Crop**: Intuitive image cropping.
- **Axios**: HTTP client with global interceptors handling cookie-based auth, server downtime, and rate limits.

### Backend
- **Node.js + Express**: Lightweight, scalable API layer.
- **MongoDB + Mongoose**: Flexible data persistence with TTL indexes for soft-deleted tasks.
- **JWT (HttpOnly cookies)**: Secure, XSS-resistant authentication.
- **bcrypt**: Password hashing.
- **Sharp**: High-performance image processing and resizing.
- **Pino**: Structured, high-throughput logging with request IDs.
- **Zod**: Request validation (shared with frontend).
- **Security Hardening**: Helmet, CORS, express-rate-limit, mongo-sanitize, hpp.

---

## 🌐 Live Links

- **Live Application (Cloudflare Pages):** [https://task-management-app-2kk.pages.dev/](https://task-management-app-2kk.pages.dev/)
- **Backend API (Render):** [https://task-management-app-piyh.onrender.com/](https://task-management-app-piyh.onrender.com/)
- **GitHub Repository:** [https://github.com/21MH1A0410/task-management-app.git](https://github.com/21MH1A0410/task-management-app.git)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ and npm
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/21MH1A0410/task-management-app.git
cd task-management-app
```

### 2. Install Dependencies

**Backend**
```bash
cd server
npm install
```

**Frontend**
```bash
cd ../client
npm install
```

### 3. Environment Variables

Create a `.env` file in the `server/` folder:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_super_strong_secret_min_32_chars
JWT_EXPIRES_IN=1d
ALLOW_ORIGINS=http://localhost:5173

# Optional rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

Create a `.env` file in the `client/` folder:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run the App

**Backend**
```bash
cd server
npm run dev
```

**Frontend**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and you’re ready to go!

---

## 🏗️ Building for Production

### Backend
```bash
cd server
npm start
```
Make sure `NODE_ENV=production` and all environment variables are set accordingly. If you prefer containerization, a Dockerfile is included.

### Frontend
```bash
cd client
npm run build
```
The static files will be generated in the `dist` folder. Serve them with any static server (Nginx, Apache, or serve).

---

## 📚 API Overview (At a Glance)

All endpoints return a consistent JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // for pagination
}
```

### Authentication
- `POST /api/users` – Register a new user
- `POST /api/users/login` – Log in (sets an HttpOnly cookie)
- `POST /api/users/logout` – Log out
- `GET /api/users/me` – Get current user info

### Tasks (require authentication)
- `GET /api/tasks` – List tasks (paginated, with search, status filter, sorting)
- `POST /api/tasks` – Create a task
- `PUT /api/tasks/:id` – Full update (all fields required)
- `PATCH /api/tasks/:id` – Partial update
- `DELETE /api/tasks/:id` – Soft delete
- `PATCH /api/tasks/:id/restore` – Restore a soft-deleted task
- `PATCH /api/tasks/complete-all` – Mark all pending/in-progress tasks as completed
- `DELETE /api/tasks?status=...&confirm=true` – Bulk delete by status

### Profile
- `GET /api/users/me` – Get current user info
- `PUT /api/users/profile` – Update name/bio
- `PUT /api/users/password` — Change password (invalidates all other sessions)
- `POST /api/users/revoke-all-sessions` — Manually revoke all active sessions
- `DELETE /api/users/profile` – Permanently delete account
- `PUT /api/users/profile-pic` – Upload a profile picture (`multipart/form-data`)
- `GET /api/users/:id/profile-pic` – Public endpoint for retrieving profile pictures

---

## 📁 Project Structure

```text
task-management-app/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI (TaskItem, TaskForm, Modal, etc.)
│   │   ├── context/             # Auth & Toast providers
│   │   ├── hooks/               # useTasks (optimistic updates)
│   │   ├── pages/               # Home, Login, Register, TaskList, Profile, etc.
│   │   ├── services/            # Axios wrappers for API calls
│   │   ├── utils/               # cropImage, apiHelpers, etc.
│   │   └── validations/         # Zod schemas (shared with backend)
├── server/                       # Node.js backend
│   ├── config/                   # DB connection
│   ├── controllers/              # Request handlers
│   ├── middleware/               # auth, error, requestId, zodResolver, httpLogger
│   ├── models/                   # Mongoose models (User, Task)
│   ├── routes/                   # Express routes
│   ├── utils/                    # Pino logger, etc.
│   └── validations/              # Zod schemas
└── README.md                     # You are here!
```

---

## 🧠 Key Design Decisions

- **HttpOnly Cookies for Auth**: JavaScript can’t read the token, so XSS attacks can’t steal it. The browser automatically sends it with every request.
- **Global Error Interceptors**: Axios handles 502/503 network states, 429 rate limits, and 401 token expirations globally preventing redundant UI error-handling code.
- **Token Versioning**: When you change your password or click “revoke all sessions”, we bump a number stored in the database. Old tokens become instantly invalid – even if they haven’t expired.
- **Soft Delete with TTL**: Deleted tasks are marked `isDeleted: true` and get a `deletedAt` timestamp. A MongoDB TTL index permanently removes them after 7 days, giving you a week to change your mind.
- **Optimistic UI**: The `useTasks` hook updates local state immediately. If the API call fails, it rolls back. A counter of active mutations prevents background syncs from overwriting optimistic changes.
- **URL-Driven Filtering**: All filter, sort, and pagination parameters live in the URL query string. This makes the back button work naturally and lets you share or bookmark specific views.
- **Zod Everywhere**: We validate user input on both the frontend (forms) and backend (requests) with the same schemas, ensuring consistency and reducing bugs.
- **Efficient Image Processing**: Profile pictures are cropped client-side, then resized and converted to JPEG server-side using Sharp. Storing as Buffer in MongoDB avoids file-system clutter.
- **Code-Splitting & Fallbacks**: React Suspense lazy-loads heavy page bundles, keeping initial loads instant. It also explicitly handles static `Terms`, `Privacy`, and `404 Not Found` fallback routing.

---

## 🤝 Contributing

This project was developed during my internship at iStudio. While it's a personal milestone, I warmly welcome feedback and suggestions! Feel free to open an issue or submit a pull request if you see something that could be improved.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for more information.

---

**Crafted with care by Rama Raju during my internship at iStudio**
