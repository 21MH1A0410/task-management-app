# Task Management API: Unified Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068b7?style=for-the-badge&logo=zod&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

A high-performance, enterprise-grade REST API built with the MERN stack. Designed for security, scalability, and seamless deployment on Google Cloud Run.

---

## 🏛️ Technical Architecture

The system implements a strict **Separation of Concerns (SoC)** through a refined MVC pattern. The service is stateless, allowing for effortless horizontal scaling.

- **Storage**: MongoDB Atlas (Global persistence)
- **Validation**: Zod (Runtime type safety)
- **Auth Strategy**: Stateful JWT using HttpOnly cookie transport
- **Logging**: Pino (High-throughput structured JSON logs)

---

## 🔒 Security Deep Dive

Security is not an afterthought in this codebase; it is built into the architecture.

### 1. Advanced Session Hardening
Unlike standard JWT implementations, this API uses a **Token Versioning** system.
- Every `User` document stores a `tokenVersion`.
- The version is embedded in the JWT.
- **Immediate Invalidation**: Changing a password increments the version, instantly rendering all existing tokens on all devices invalid.

### 2. XSS & CSRF Mitigation
- **XSS Defense**: Tokens are stored in `HttpOnly` cookies, making them inaccessible to malicious client-side scripts.
- **Cookie Policy**: Configured with `SameSite: Strict` and `Secure` (production only) to prevent CSRF and session leaking.

### 3. API Hardening Layer
- **NoSQL Injection**: Guarded by `express-mongo-sanitize` and strict Zod schema parsing.
- **Rate Limiting**: Intelligent limits (100 req/15min) protect against DDoS and brute-force attempts.
- **Response Safety**: Sensitive fields (passwords, internal IDs) are explicitly excluded using Mongoose projection and field whitelisting.

---

## 📂 Project Structure

```text
server/
├── config/           # Infrastructure & DB wiring
├── controllers/      # High-level business logic & request handling
├── middleware/       # Pipeline security (Auth, Error handling, Logging)
├── models/           # Mongoose schemas & persistence logic
├── routes/           # API plumbing & endpoint mapping
├── utils/            # Shared utilities (Pino Logger, Formatters)
└── validations/      # Zod runtime schema definitions
```

---

## 📋 API Reference

### User Authentication
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Register new account | `{ name, email, password }` |
| `POST` | `/api/users/login` | Secure session initiation | `{ email, password, rememberMe }` |
| `POST` | `/api/users/logout` | Immediate session termination | - |
| `GET` | `/api/users/me` | Retrieve authenticated identity | - |

### Task Management
| Method | Endpoint | Description | Note |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List resources | Supports pagination, search, and sorting |
| `POST` | `/api/tasks` | Create task | Zod guarded |
| `PATCH` | `/api/tasks/:id` | Partial update | Mass-assignment safe |
| `DELETE` | `/api/tasks/:id` | Soft delete | Recovery period enabled |
| `PATCH` | `/api/tasks/:id/restore` | Restore resource | - |

---

## 🚀 Environment & Setup

### Configuration
Create a `.env` file in the `server/` root.

```env
# Required
MONGO_URI=your_atlas_connection_string
JWT_SECRET=your_high_entropy_secret_32_chars

# Production Optimization
NODE_ENV=production
ALLOW_ORIGINS=https://your-app.com
LOG_LEVEL=info
```

### Installation
```bash
npm install
npm run dev   # Development with Nodemon
npm start     # Production process
```

---

## 🚢 Deployment (PROD)

The service is pre-configured for **Google Cloud Run**.

1. **Build**: `docker build -t server-image ./server`
2. **Push**: Push to Google Artifact Registry.
3. **Deploy**: Deploy as a managed service on GCR.
4. **Networking**: Ensure MongoDB Atlas whitelists your GCR egress traffic.

---

## 🛠️ Roadmap
- [ ] Redis integration for session caching.
- [ ] Real-time updates via WebSockets.
- [ ] Automated OpenAPI 3.0 documentation generation.
- [ ] Centralized audit logs for administrative actions.

---

### Author
**Rama Raju** — Senior MERN Architect
[GitHub](https://github.com/yourusername) • [LinkedIn](https://www.linkedin.com/in/rama-raju-b-k-/)
