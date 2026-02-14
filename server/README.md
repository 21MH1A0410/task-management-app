# Task Management API

A REST API for managing tasks, built with Node.js, Express, and MongoDB. I built this during my internship to practice implementing secure backend architecture and learn proper API design patterns.

---

## 🌐 Demo

- **Backend API**: [Deploy on Render] (comming soon)
- **API Docs**: [Postman Collection](https://documenter.getpostman.com/view/your-collection) (comming soon)
- **Frontend**: React + vite client under development

---

## Features

- JWT authentication with token-based auth
- Full CRUD operations for tasks with soft delete
- Centralized input validation using Zod
- Rate limiting on auth routes and globally
- Security middleware (Helmet, Mongo Sanitize, HPP)
- Soft deletes to preserve data
- Pagination and filtering for task queries
- MongoDB indexes optimized for query patterns
- Centralized error handling
- Graceful server shutdown

---

## Architecture

Built with a standard MVC pattern:

```
Client Request
      ↓
Security Middleware (Helmet, Rate Limiting)
      ↓
Routes
      ↓
Validation Layer (Zod)
      ↓
Authentication (JWT)
      ↓
Controllers (Business Logic)
      ↓
Models (Mongoose ODM)
      ↓
MongoDB Database
```

**Design choices:**
- Validation happens at the route level to fail fast
- All queries are scoped to the authenticated user
- Configuration is driven by environment variables
- Mongoose handles database interactions

---

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB
- Mongoose

### Auth & Security
- jsonwebtoken
- bcryptjs
- Helmet
- express-rate-limit
- express-mongo-sanitize
- hpp

### Validation
- Zod

### Dev Tools
- Morgan (request logging)
- dotenv

---

## Security

Security was an important focus while building this API:

- JWT with HS256 algorithm enforcement (prevents algorithm confusion attacks)
- Mass assignment protection via field whitelisting
- 10kb payload limit to prevent DoS
- NoSQL injection prevention (mongo-sanitize + Zod)
- HPP middleware to prevent parameter pollution
- Rate limiting: 100 req/15min (global), 5 req/15min (auth routes)
- Helmet for secure HTTP headers
- Input validation on all endpoints
- bcrypt password hashing (10 rounds)
- Race condition handling for concurrent requests

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/users` | Register | No |
| POST | `/api/users/login` | Login | No |
| GET | `/api/users/me` | Get current user | Yes |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | Get all tasks (paginated) | Yes |
| POST | `/api/tasks` | Create task | Yes |
| GET | `/api/tasks/:id` | Get single task | Yes |
| PUT | `/api/tasks/:id` | Full update | Yes |
| PATCH | `/api/tasks/:id` | Partial update | Yes |
| DELETE | `/api/tasks/:id` | Soft delete | Yes |
| DELETE | `/api/tasks?status=...` | Bulk delete by status | Yes |
| PATCH | `/api/tasks/complete-all` | Mark all complete | Yes |
| POST | `/api/tasks/quick` | Quick create | Yes |

**Query params for GET /api/tasks:**
- `page` - Page number (default: 1)
- `limit` - Items per page (max: 50)
- `status` - Filter: pending, in-progress, or completed
- `search` - Full-text search on title

---

## Environment Setup

Create `.env` in `/server`:

```env
# Required
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_minimum_32_characters
PORT=5000

# Optional (defaults shown)
NODE_ENV=development
ALLOW_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
DB_TIMEOUT_MS=30000
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=2
MAX_PAGINATION_LIMIT=50
```

---

## Getting Started

**Prerequisites:**
- Node.js v14+
- MongoDB (local or Atlas)
- npm or yarn

**Installation:**

```bash
# Clone
git clone https://github.com/yourusername/task-management-app.git
cd task-management-app/server

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your values

# Run dev server
npm run dev

# Or production
npm start
```

Server runs at `http://localhost:5000`

---

## Project Structure

```
server/
├── config/
│   └── db.js              # MongoDB connection with retry logic
├── controllers/
│   ├── taskController.js  # Task logic
│   └── userController.js  # User & auth logic
├── middleware/
│   ├── authMiddleware.js  # JWT verification
│   ├── errorMiddleware.js # Error handler
│   └── zodResolver.js     # Validation middleware
├── models/
│   ├── Task.js            # Task schema
│   └── User.js            # User schema
├── routes/
│   ├── taskRoutes.js      # Task routes
│   └── userRoutes.js      # User routes
├── validations/
│   ├── taskValidation.js  # Zod schemas
│   └── userValidation.js  # Zod schemas
├── .env
└── server.js              # Entry point
```

---

## Design Decisions

### Why Zod?
I chose Zod over manual validation because:
- Centralized schemas in one place
- Better than scattered `if` checks
- Reusable across params, body, and query
- Clear error messages out of the box

### Why Soft Deletes?
Instead of permanently deleting tasks:
- Keeps audit trail
- Users can recover accidentally deleted tasks
- Enables historical data analysis

### Why These Indexes?
I added compound indexes based on actual query patterns:
- `{ user: 1, createdAt: -1 }` - Listing user's tasks by date
- `{ user: 1, status: 1 }` - Filtering by status
- `{ user: 1, isDeleted: 1, createdAt: -1 }` - Soft delete queries
- `{ user: 1, dueDate: 1 }` - Sorting by due date
- `{ title: 'text' }` - Search functionality

### Why Field Whitelisting?
In PATCH requests, I whitelist allowed fields to prevent mass assignment attacks. Without this, users could potentially modify:
- `user` field (escalate privileges)
- `isDeleted` field (tamper with data)
- `createdAt` field (manipulate timestamps)

### Why Connection Pooling?
Mongoose reuses database connections instead of opening new ones for every request. I configured min 2, max 10 connections based on expected load.

---

## Future Ideas

Possible future improvements:
- Refresh tokens for better session management
- Swagger docs for the API
- Redis caching for frequently accessed data
- WebSockets for real-time updates
- Email notifications for task reminders
- Role-based access (admin vs regular user)
- Task sharing/collaboration
- File attachments
- Activity logs
- CSV/PDF export

---

## Testing

```bash
# Tests coming soon
npm test
npm run test:coverage
```

---

## Response Format

**Success:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete project",
    "status": "in-progress"
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Task not found",
  "stack": "..." // dev only
}
```

---

## Contributing

Feel free to open issues or submit PRs:

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/your-feature`)
5. Open a PR

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Author

**Rama Raju**  
Full Stack Developer | MERN Stack

- LinkedIn: [Rama Raju](https://www.linkedin.com/in/rama-raju-b-k/)

---

## Acknowledgments

Thanks to the teams behind Express, Mongoose, and Zod for their excellent libraries.

---

## Status

Version 1.0.0 — February 2026

<div align="center">

Made by Rama Raju

⭐ Star if helpful!

</div>
