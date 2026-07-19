# SkillSphere

SkillSphere is a full-stack MERN platform connecting clients with freelancers in a hyperlocal environment — AI-powered job matching, milestone/escrow payments, weighted reputation scoring, real-time collaboration, and admin analytics.

---

## Tech Stack

**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT Auth · Socket.IO · Nodemailer · Cloudinary · Razorpay · node-cron  
**Frontend:** React 18 · Redux Toolkit · React Router v6 · Tailwind CSS · Vite · Socket.IO client · Recharts  
**Tooling:** Concurrently · Nodemon · ESLint

### Third-party services — dev-mode fallbacks

Every third-party integration below runs in a **mock/local mode by default** so the app is fully runnable without any paid accounts. See [Manual setup steps](#manual-setup-steps-for-production-credentials) for how to swap in real credentials.

| Service | Used for | Without credentials |
|---|---|---|
| Nodemailer | Verification/reset/notification emails | Auto-creates a free Ethereal test inbox; preview URL logged to console |
| Cloudinary | Avatars, portfolio images, resumes, chat files, dispute evidence | Falls back to local disk storage under `backend/uploads/`, served at `/uploads/*` |
| Razorpay | Escrow/milestone payments | Falls back to an in-process mock gateway that simulates orders/captures/refunds |
| Google OAuth | "Continue with Google" login | Button is present but login will fail until `GOOGLE_CLIENT_ID` is set |
| Hugging Face | AI job-matching scores | Falls back to a local skill-overlap + rating similarity algorithm |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Install dependencies
```bash
npm run install-all
```

### Configure environment
Edit `backend/.env`:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillsphere
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Run (development)
```bash
npm run dev
```
- Frontend → http://localhost:5173  
- Backend API → http://localhost:5000

---

## Week 1 Features — Authentication & User Management

- User registration with roles: `client`, `freelancer`, `admin`
- JWT login / logout
- Protected and public routes
- Profile management (name, bio, skills, avatar)
- Redux auth slice with localStorage persistence
- Role-based access control middleware
- Dashboard layout with responsive Sidebar + Navbar
- **Email verification** — signup sends a 24h verification link; unverified users see a "Resend email" prompt on their profile
- **Password reset** — `/forgot-password` emails a 1h reset link; `/reset-password/:token` sets a new password
- **Two-factor authentication (2FA)** — optional per-account toggle in Profile → Security; when enabled, login emails a 6-digit one-time code that must be verified before a session token is issued
- **Google OAuth login** — "Continue with Google" button on Login/Register verifies the Google ID token server-side and links or creates an account (requires `GOOGLE_CLIENT_ID`, see [Manual setup steps](#manual-setup-steps-for-production-credentials))

---

## Week 2 Features — Gig Marketplace & Proposal System

### Gig Marketplace
- Clients can create, edit, delete, and manage gigs
- Browse all open gigs with search, filter, and pagination
- Filter by skill, budget range, status, and keyword search
- Gig statuses: `open` → `in-progress` → `completed` / `closed`
- Gig detail page with client info and skills required

### Proposal System
- Freelancers can submit proposals on open gigs
- One proposal per freelancer per gig (duplicate blocked)
- Proposal fields: cover letter, bid amount, estimated days
- Client can accept or reject individual proposals
- Accepting a proposal auto-rejects all other pending proposals
- Accepting a proposal moves gig status to `in-progress`
- Freelancers can withdraw pending proposals

### Dashboard Analytics
- **Client dashboard:** total gigs, open gigs, active gigs, completed gigs, proposals received
- **Freelancer dashboard:** total proposals, pending, accepted, active jobs

### Role-based Sidebar Navigation
- **Client:** Dashboard · My Gigs · Create Gig · Profile
- **Freelancer:** Dashboard · Browse Gigs · My Proposals · Profile
- **Admin:** Dashboard · All Gigs · Profile

---

## API Documentation

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| GET | `/api/auth/verify-email/:token` | Public | Verify email from emailed link |
| POST | `/api/auth/resend-verification` | Private | Resend verification email |
| POST | `/api/auth/login` | Public | Login, returns JWT (or `twoFactorRequired: true`) |
| POST | `/api/auth/verify-2fa` | Public | Verify OTP `{ userId, otp }`, returns JWT |
| PUT | `/api/auth/2fa` | Private | Enable/disable 2FA `{ enabled }` |
| POST | `/api/auth/forgot-password` | Public | Email a password reset link |
| PUT | `/api/auth/reset-password/:token` | Public | Set new password `{ password }` |
| POST | `/api/auth/google` | Public | Login/register with a Google ID token `{ credential, role? }` |
| POST | `/api/auth/logout` | Public | Clear cookie |
| GET | `/api/auth/me` | Private | Get current user |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/profile` | Private | Get own profile |
| PUT | `/api/users/profile` | Private | Update own profile |

### Gigs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/gigs` | Public | List gigs (search, filter, paginate) |
| POST | `/api/gigs` | Client/Admin | Create gig |
| GET | `/api/gigs/my` | Client | Get own gigs |
| GET | `/api/gigs/:id` | Public | Get single gig |
| PUT | `/api/gigs/:id` | Owner/Admin | Update gig |
| DELETE | `/api/gigs/:id` | Owner/Admin | Delete gig |

#### Gig query params
```
GET /api/gigs?search=react&skill=Node&budgetMin=100&budgetMax=1000&status=open&page=1&limit=9
```

Response:
```json
{
  "success": true,
  "page": 1,
  "pages": 4,
  "total": 40,
  "data": []
}
```

### Proposals
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/proposals` | Freelancer | Submit proposal |
| GET | `/api/proposals/my` | Freelancer | Get own proposals |
| GET | `/api/proposals/gig/:gigId` | Gig Owner/Admin | Get proposals for a gig |
| PUT | `/api/proposals/:id` | Proposal Owner | Edit proposal |
| DELETE | `/api/proposals/:id` | Proposal Owner | Withdraw proposal |
| PUT | `/api/proposals/:id/accept` | Client (gig owner) | Accept proposal |
| PUT | `/api/proposals/:id/reject` | Client (gig owner) | Reject proposal |

### Dashboard
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/dashboard/client` | Client/Admin | Client stats |
| GET | `/api/dashboard/freelancer` | Freelancer/Admin | Freelancer stats |

---

## Project Structure

```
skillsphere/
├── backend/
│   └── src/
│       ├── config/        # DB connection
│       ├── controllers/   # Business logic
│       ├── middleware/    # Auth, roles, error handling
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routers
│       └── utils/         # Token generator
├── frontend/
│   └── src/
│       ├── components/    # Navbar, Sidebar
│       ├── layouts/       # DashboardLayout
│       ├── pages/         # All page components
│       ├── redux/         # Store + slices
│       ├── routes/        # ProtectedRoute, PublicRoute
│       └── services/      # Axios API wrappers
├── package.json           # Root scripts (concurrently)
└── README.md
```

---

## Screenshots

> _Screenshots will be added here in Week 3._

---

## Roadmap

- **Week 1** ✅ Auth, roles, profile, dashboard
- **Week 2** ✅ Gig marketplace, proposal system, search & filtering, dashboard analytics
- **Week 3** 🚧 In progress — real-time messaging, notifications, reviews, AI matching
- **Week 4** 🔜 Payments, admin dashboard, scheduler, disputes, progress tracker, freelancer analytics, security hardening

### Infrastructure (chore)

Foundational plumbing added ahead of the features that depend on it:
- Nodemailer email service (`backend/src/config/email.js`, `backend/src/utils/sendEmail.js`) with automatic Ethereal fallback in dev
- File upload pipeline (`backend/src/utils/uploadFile.js`, `backend/src/middleware/uploadMiddleware.js`) — Cloudinary if configured, else local disk under `backend/uploads/` served at `/uploads/*`
- Socket.IO server (`backend/src/socket/index.js`) — JWT-authenticated sockets, per-user rooms for notifications, per-conversation rooms for chat (messaging, typing indicators, read receipts)
- `Conversation`, `Message`, and `Notification` Mongoose models plus a shared `notify()` helper (`backend/src/utils/notify.js`) that every feature (proposals, payments, reviews, etc.) will push through consistently
- Daily deadline-reminder cron job (`backend/src/jobs/deadlineReminderJob.js`, `node-cron`) — notifies client + assigned freelancer 24h before an in-progress gig's deadline
- Frontend Socket.IO client wrapper (`frontend/src/services/socket.js`) and upload-URL resolver (`frontend/src/utils/resolveFileUrl.js`)

## Manual setup steps for production credentials

These are optional in development (everything has a working fallback) but required before a real deployment:

1. **Email** — set `EMAIL_USER`/`EMAIL_PASS` in `backend/.env` to a real SMTP account (e.g. a Gmail App Password) so verification/reset/notification emails reach real inboxes.
2. **Cloudinary** — create a free account at cloudinary.com, set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. **Razorpay** — create a Razorpay account, generate **test-mode** keys first, set `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`. Swap for live keys only after a real go-live review.
4. **Google OAuth** — create an OAuth Client ID in Google Cloud Console (Web application), add `http://localhost:5173` as an authorized origin, set `GOOGLE_CLIENT_ID` in both `backend/.env` and as `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.
5. **Hugging Face (optional)** — set `HUGGINGFACE_API_KEY` to use a hosted embedding model for job matching instead of the local fallback.
6. **MongoDB Atlas** — replace `MONGO_URI` with your Atlas connection string for a shared/production database.
