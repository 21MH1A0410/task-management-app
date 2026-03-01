# Project Report: Task Management Web Application

## 1️⃣ Introduction

**Project Name:** Task Management Web Application

**Objective:**
The application is a full-stack, secure task management system designed for robust performance. It enables users to safely sign up, log in, and perform CRUD operations on tasks. State is managed systematically via URL-driven parameters and optimistic UI patterns. Authentication is implemented using JWT stored in HttpOnly cookies with token versioning to support secure session invalidation.

## 2️⃣ Features List
- **JWT Authentication** – Secure sessions managed entirely via HttpOnly cookies.
- **Token Versioning** – Ensures instant session invalidation (e.g., upon password changes).
- **User Management** – Full signup, login, and logout capabilities securely implemented.
- **Task CRUD Operations** – Creating, reading, updating, and deleting tasks executed with optimistic UI.
- **Task Filtering & Sorting** – Filter tasks by status, sort by newest, oldest, or due date. 
- **URL-Driven State Management** – State for filters and pagination preserved automatically in the URL.
- **Search Capabilities** – Instant search strictly by task title.
- **Soft Delete & Recovery** – Deleted tasks are soft-deleted and permanently removed securely after 7 days utilizing a MongoDB TTL index.
- **Profile Picture Handling** – Picture upload with client-side cropping and backend image resizing via Sharp.
- **Security Middleware** – Fully fortified using Helmet, rate-limiting, express-mongo-sanitize, hpp, and CORS.
- **Structured Logging** – Detailed request observability using Pino.

## 3️⃣ Document Technologies Used

**Frontend (Client):**
- **React.js (v18+)** + **Vite** – For building a fast, modern user interface.
- **React Router (v6)** – For client-side URL-driven navigation.
- **Tailwind CSS (v4)** & **Headless UI** – For UI styling and accessible components.
- **React Hook Form** & **Zod** – For type-safe form handling and rigorous client-side validation.
- **Axios** – For API requests with interceptors handling cookie-based auth.
- **React Easy Crop** – For client-side image cropping.

**Backend (Server):**
- **Node.js** & **Express.js** – For robust server-side API development.
- **MongoDB** & **Mongoose** – NoSQL database for flexible data persistence (including TTL indexing).
- **JWT** & **bcrypt** – For authentication, secure sessions, and password hashing.
- **Sharp** – High-performance image processing and resizing.
- **Multer** – Handling multipart/form-data for file uploads.
- **Pino** – Structured, high-throughput logging.
- **Security Middleware:** Helmet, CORS, express-rate-limit, express-mongo-sanitize, hpp.

**Deployment:**
- **Render** – For hosting the Node.js backend.
- **MongoDB Atlas** – Cloud database service.
- **Cloudflare Pages** – For deploying the React frontend.
- **GitHub** – For version control and collaboration.

## 4️⃣ Live Links for Deployment
- **Live Application (Cloudflare Pages):** [https://task-management-app-2kk.pages.dev/](https://task-management-app-2kk.pages.dev/)
- **Backend API (Render):** [https://task-management-app-piyh.onrender.com/](https://task-management-app-piyh.onrender.com/)
- **GitHub Repository:** [https://github.com/21MH1A0410/task-management-app.git](https://github.com/21MH1A0410/task-management-app.git)

## 5️⃣ Setup Instructions for Running Locally

**Prerequisites**
- Install Node.js (v18+) and npm.
- Install MongoDB (or use MongoDB Atlas).
- Clone the repository from GitHub.

**Backend Setup**
1. Navigate to the backend folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `server` folder:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/taskmanager
   JWT_SECRET=your_super_strong_secret_min_32_chars
   JWT_EXPIRES_IN=1d
   ALLOW_ORIGINS=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
5. Verify that the API is running at `http://localhost:5000/`.

**Frontend Setup**
1. Navigate to the frontend folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in the `client` folder:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173/` in a browser to view the application.

## 6️⃣ Testing and Bug Fixes Summary
- Manually tested all features using live UI interactions and verifying responses.
- Checked authentication flow (login/logout, HttpOnly JWT token validation, token versioning on password change).
- Verified API requests, responses, and consistent JSON envelope formatting in browser DevTools.
- Tested responsiveness and UI consistency on mobile and desktop views.
- Fixed performance issues by optimizing API calls, utilizing optimistic UI for instant feedback, and managing active mutation states to prevent syncing conflicts.
- Ensured profile image cropping worked correctly strictly adhering to defined dimensions on upload.

## 7️⃣ Architecture Overview

Client (React + Vite)
        ↓
REST API (Express)
        ↓
MongoDB Atlas

**Request Flow:**
- **User → Frontend:** User interacts with the UI (e.g., adds a task).
- **Frontend → API:** Axios intercepts the request, appending HttpOnly cookies securely to the API endpoint.
- **API → DB:** The Express backend validates the Zod schema, processes business logic, and queries MongoDB.
- **DB → API → Frontend:** MongoDB responds to the API, which formats a standard JSON envelope sent back to the client to trigger an optimistic UI update.

## 8️⃣ Performance Optimizations
- **Optimistic Updates:** Reduced perceived latency drastically by updating the interface before the server responds.
- **Memoized Hooks & Callbacks:** Prevented unnecessary re-renders leveraging React hooks to stabilize dependencies securely.
- **Indexed Database Fields:** Used TTL indexes and indexing logic within MongoDB for significantly faster queries and automatic soft-delete cleanup.
- **Efficient Image Processing:** Utilized buffer operations sequentially via Sharp reducing file-system and latency bottlenecks.

## 9️⃣ Challenges Faced & Solutions
- **Cross-Domain Cookies:** Overcoming strict origin policies to correctly manage secure authentication across separate Cloudflare and Render deployments seamlessly.
- **Optimistic UI Syncing:** Mitigating state clashes when rapid successive updates trigger backend mutations preventing old states from overriding new user inputs.
- **Soft Delete Strategy:** Designing a non-destructive delete action leveraging MongoDB's TTL index to permanently destroy data 7 days post-action accurately.
- **Secure Image Processing:** Protecting endpoints against malicious payloads by integrating `multer` for memory storage and `sharp` exclusively to strip excess file data entirely.

## 🔟 Future Improvements
*These planned enhancements highlight architectural foresight, scalability awareness, and a continued focus on user experience.*

- **Role-Based Access Control (RBAC):** Implementing admin functionality to permit multi-layered user and permissions management.
- **Automated Task Reminders:** Integrating scheduled Cron jobs or WebSockets to alert users regarding impending deadlines securely.
- **Drag-and-Drop Organization:** Utilizing a robust drag-and-drop library (e.g., `dnd-kit`) to let users dictate custom sorting paradigms within the UI.
- **Data Analytics Dashboard:** Providing aggregated visualization capabilities to track long-term task completion metrics and bottlenecks.
- **Native Dark Mode Support:** Extending the Tailwind configuration to adapt seamlessly to user system preferences contextually.
