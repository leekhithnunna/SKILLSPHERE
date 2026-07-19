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

## Freelancer Professional Profiles

A dedicated "Professional Profile" page (freelancer-only, linked from the sidebar) extends the basic profile with:
- Skills with a proficiency level (beginner/intermediate/advanced/expert) — separate from the simple tag-style `skills` list used for search/matching, to avoid disrupting the existing profile editor
- Portfolio gallery (image upload + title/description/project link)
- Resume upload
- Certifications (name, issuer, year, credential URL)
- Work experience timeline
- Weekly availability calendar (hours/day) — feeds the availability scheduler
- Hourly rate + milestone-pricing acceptance toggle
- Verification badge (`freelancerProfile.isVerifiedBadge`) — set by an admin from the Admin Dashboard, not self-service
- Profile view counter, incremented whenever someone other than the owner views `GET /api/users/:id` (feeds the freelancer analytics dashboard)

Basic identity fields (name, avatar, bio, tag-style skills, city/country location) stayed on the original Profile page.

---

## Week 2 Features — Gig Marketplace & Proposal System

### Gig Marketplace
- Clients can create, edit, delete, and manage gigs
- **Budget ranges** — gigs store `budgetMin`/`budgetMax` (was a single number); search matches on range overlap
- **Milestones** — clients define named milestones with an amount and due date when creating/editing a gig; each tracks its own `pending → in-progress → completed → approved` status (feeds the Payments and Progress Tracker modules)
- **Document attachments** — clients upload/remove files on a gig (spec docs, briefs) via the Cloudinary/local-disk upload pipeline
- **Freelancer invites** — clients invite a specific freelancer by email from the gig detail page; the freelancer gets a real-time + email notification and sees it on their new "Invitations" page
- Browse all open gigs with search, filter, and pagination
- Filter by skill, budget range, status, and keyword search
- Gig statuses: `open` → `in-progress` → `completed` / `closed`
- Gig detail page with client info, skills required, milestones, and attachments

### Proposal System
- Freelancers can submit proposals on open gigs
- One proposal per freelancer per gig (duplicate blocked)
- Proposal fields: cover letter, bid amount, estimated days
- Client can accept or reject individual proposals from the new **Gig Proposals** page (`/gigs/:id/proposals`, linked from My Gigs and the gig detail page) — the accept/reject backend already existed but had no frontend UI until now
- **Price negotiation** — either party can counter-offer via `PUT /api/proposals/:id/negotiate`; each counter is appended to `negotiationHistory` and the proposal moves to a `negotiating` status; accepting a negotiated proposal locks in the last countered amount as the final `bidAmount`
- Accepting a proposal auto-rejects all other pending/negotiating proposals
- Accepting a proposal moves gig status to `in-progress`
- Freelancers can withdraw pending proposals
- Notifications fire on proposal received/accepted/rejected/countered (real-time + email for accept)

### Smart Reputation & Review System
- Reviews are gated on a **completed gig with an accepted proposal** linking reviewer and reviewee — there's no path to review someone you didn't actually work with
- **Weighted reputation score** (`utils/reputationScore.js`) instead of a plain average: reviews on higher-budget gigs (proxy for significant work) count more, and reviews older than 180 days are down-weighted — recomputed and denormalized onto `User.reputationScore`/`reviewCount` whenever a non-flagged review is created
- Optional per-criteria sub-ratings (communication, quality, timeliness, professionalism) surfaced as a breakdown on the public profile
- **Fraud detection**: reviews are flagged (excluded from the score, kept for audit) when a reviewer posts 3+ reviews within 10 minutes, or repeats identical comment text — flagged reviews stay in the database with `flagged`/`flagReason` for the admin module to act on
- New public profile page (`/users/:id`) shows a freelancer's or client's bio, skills, portfolio, experience, weighted rating, and full review list
- `GET /api/gigs/:id` now also returns `acceptedFreelancer` once a gig is in-progress/completed, so both parties (and future chat/payment features) know who they're paired with without needing owner-only proposal access

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
| PUT | `/api/users/profile` | Private | Update own profile (name, bio, skills, avatar, location) |
| GET | `/api/users/:id` | Public | Get a freelancer's public profile (increments `profileViews`) |
| PUT | `/api/users/freelancer-profile` | Freelancer | Update skills w/ proficiency, certifications, experience, pricing, weekly availability |
| POST | `/api/users/portfolio` | Freelancer | Add a portfolio item (`multipart/form-data`, optional `image`) |
| DELETE | `/api/users/portfolio/:itemId` | Freelancer | Remove a portfolio item |
| POST | `/api/users/resume` | Freelancer | Upload/replace resume (`multipart/form-data`, `resume` file) |

### Gigs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/gigs` | Public | List gigs (search, filter, paginate) |
| POST | `/api/gigs` | Client/Admin | Create gig — `budgetMin`, `budgetMax`, optional `milestones[]` |
| GET | `/api/gigs/my` | Client | Get own gigs |
| GET | `/api/gigs/invited` | Freelancer | Get gigs you've been personally invited to |
| GET | `/api/gigs/:id` | Public | Get single gig |
| PUT | `/api/gigs/:id` | Owner/Admin | Update gig (incl. `milestones[]`) |
| DELETE | `/api/gigs/:id` | Owner/Admin | Delete gig |
| POST | `/api/gigs/:id/invite` | Owner | Invite a freelancer by `{ email }` |
| POST | `/api/gigs/:id/attachments` | Owner | Attach a document (`multipart/form-data`, `file`) |
| DELETE | `/api/gigs/:id/attachments/:attachmentId` | Owner | Remove an attachment |

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
| PUT | `/api/proposals/:id/negotiate` | Client or Freelancer | Counter-offer `{ amount, message? }` |
| DELETE | `/api/proposals/:id` | Proposal Owner | Withdraw proposal |
| PUT | `/api/proposals/:id/accept` | Client (gig owner) | Accept proposal (locks in latest negotiated amount) |
| PUT | `/api/proposals/:id/reject` | Client (gig owner) | Reject proposal |

### Reviews
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/reviews` | Private | Leave a review `{ gigId, revieweeId, rating, comment?, criteria? }` |
| GET | `/api/reviews/user/:userId` | Public | Get a user's non-flagged reviews + weighted reputation stats |
| GET | `/api/reviews/my` | Private | Get reviews you've written |

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
