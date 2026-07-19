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

## Advanced Search Engine

- **Freelancer directory** (`GET /api/users`, new "Find Freelancers" client-facing page) — filters by skill, city/country, hourly-rate range, minimum rating, and a minimum-experience proxy (completed review count, since the app has no separate "years of experience" field)
- **Location-based gig search** — `city`/`country` filters added to the existing `GET /api/gigs` (which already had skill/budget-range/status/keyword search from Week 2)
- **Uses plain MongoDB queries** (regex + range filters), not MongoDB Atlas Search or Elasticsearch — both are cluster-level features that can't be provisioned from application code; see [Manual setup steps](#manual-setup-steps-for-production-credentials) for how to layer Atlas Search on top of this later without changing the API shape

## Freelancer Availability Scheduler

- **Availability slots** — derived from `freelancerProfile.weeklyAvailability` (hours/day, set in Professional Profile), conventionally starting at 09:00 (documented simplification — the data model stores an hours-per-day count, not explicit time ranges)
- **Booking system** — `GET /api/bookings/availability/:freelancerId?date=` returns hourly slots marked available/booked; clients book directly from a freelancer's public profile
- **Automatic scheduling** — bookings are confirmed immediately if the slot falls inside the freelancer's availability window and doesn't conflict with an existing confirmed booking; no manual approval step
- New `/scheduler` page for both sides to view upcoming/past bookings and cancel

## Dispute Resolution System

- **Dispute request** — either the client or accepted freelancer on an in-progress/completed gig can raise a dispute against the other; notifies the other party and every admin
- **Evidence upload** — either party attaches files (Cloudinary/local-disk) while a dispute is `open`/`under_review`
- **Admin mediation** — admins review evidence and resolve with notes, either `resolved` or `rejected`; both parties are notified (email + real-time)
- Logged to `AdminLog` alongside the other admin actions

## Project Progress Tracker

- **Task completion percentage** — `Gig.completionPercentage`, auto-derived from approved-milestone ratio whenever a milestone payment is released, but overridable by the freelancer's own self-reported percentage in a progress update (documented trade-off: milestones are often too coarse-grained to reflect real-time progress, so a manual number takes precedence until the next milestone approval recomputes it)
- **Progress logs** — new `ProgressLog` collection; the accepted freelancer posts timestamped text updates (optionally with a percentage and a file deliverable) on an in-progress gig, visible to both parties as a timeline
- **File uploads** — each progress log can carry one attachment via the existing upload pipeline
- **Deadline reminders** — already covered by the `node-cron` job added during infrastructure work (daily sweep, 24h-out email + notification to both parties)
- Surfaced as a progress bar + timeline + post-update form on the gig detail page (visible once a gig is in-progress/completed)

## Admin Dashboard

All routes under `/api/admin/*` are admin-only (`authorizeRoles('admin')`), and every mutating action is written to a new `AdminLog` audit-trail collection.

- **Manage users** — search/filter by role, view reputation
- **Suspend accounts** — blocks login (checked in `authController.login`); admins can't suspend other admins
- **Verify freelancers** — grants the `freelancerProfile.isVerifiedBadge` shown on public profiles, notifies the freelancer
- **Approve/hide gigs** — `Gig.isApproved` gates whether a gig appears in the public `GET /api/gigs` listing (defaults `true` so existing gigs are unaffected; this is an extra moderation lever, not a hard pre-publish gate)
- **Payment monitoring** — every transaction platform-wide with status and mock/live mode
- **Fraud detection** — surfaces reviews the automated heuristics (module 8) flagged, with the reason
- **Admin analytics**: platform revenue (sum of released payments), active freelancers (accepted a proposal in the last 30 days), top skill categories (bar chart), job success rate (`completedGigs / (completedGigs + closedGigs)`)
- Fixed a pre-existing bug: the admin sidebar's "All Users" link pointed at `/my-gigs` (a leftover from when the admin nav was scaffolded) — it now correctly points at the new admin pages

## AI-Powered Job Matching

Goes beyond simple skill-tag filtering (PDF Module 2's example: a client posts a React job and the system should surface the top nearby, best-fit freelancers):

- **Skill similarity scoring** (`backend/src/utils/skillSimilarity.js`) — uses the Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2` embeddings, cosine similarity) when `HUGGINGFACE_API_KEY` is set; otherwise falls back to local Jaccard similarity over normalized skill sets. Falls back automatically on any API error too, so matching never breaks because of a flaky third party.
- **Freelancer recommendations for a gig** — `GET /api/matching/gigs/:gigId/recommendations` scores every freelancer as `0.6×skillSimilarity + 0.25×weightedReputation + 0.15×locationMatch` (same city > same country > none) and returns the top 10. Surfaced on the client's Gig Proposals page with one-click invite.
- **Personalized gig recommendations for freelancers** — `GET /api/matching/recommended-gigs` scores open gigs as `0.85×skillSimilarity + 0.15×recency` against the freelancer's skills. Surfaced as a "Recommended For You" strip on Browse Gigs.
- **Trending skills detection** — `GET /api/matching/trending-skills` aggregates `skillsRequired` across gigs posted in the last 30 days; shown as clickable filter chips on Browse Gigs.
- Added optional `location {city, country}` to `Gig` (mirroring `User.location`) to power the hyperlocal part of matching.

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

### Real-Time Chat & Collaboration
Built on the Socket.IO server added in the infrastructure commit:
- Instant messaging between any two users, optionally scoped to a gig, via a new `/messages` page (sidebar-linked for every role)
- Conversations + message history persisted (`Conversation`, `Message` models) and loaded via REST on open; new messages stream over `message:send`/`message:new` Socket.IO events
- File sharing — upload via `POST /api/conversations/:id/attachments`, then sent as a message attachment
- Typing indicators (`typing:start`/`typing:stop`) and read receipts (`message:read`, tracked per-message in `readBy[]`)
- A user only gets a persisted "new message" notification if they're not already viewing that conversation's room — avoids spamming the bell while actively chatting
- "Message" buttons added to the gig detail page (client ↔ accepted freelancer) and the public profile page
- WebRTC video calls (listed as *optional* in the spec) were **not** implemented — deliberately out of scope for this pass; the conversation model is ready to carry a `call:*` signaling event set if added later

### Notification System
- Bell icon in the navbar (every role) with an unread-count badge, dropdown list, "mark all read", and click-to-navigate via each notification's `link`
- Backed by the `Notification` model + `notify()` helper added during infrastructure work — this commit adds the missing list/read REST API and the frontend UI that actually surfaces them
- Real-time delivery via the `notification:new` Socket.IO event (prepends to the dropdown live); REST fetch on load covers the history
- Notification types wired so far: proposal received/accepted/rejected/negotiated, review added, message received, gig invite, deadline reminders (cron job) — payment events, dispute events, and gig-approval land with their respective modules below. "New gig posted" as a broad skill-matched alert to freelancers is covered instead by the AI job-matching recommendations feed (module 2) rather than a per-gig blast notification.

### Secure Payment System
- **Escrow flow**: client pays into escrow (`created` → `escrow`) → freelancer marks the milestone complete → client releases funds (`escrow` → `released`) or refunds before releasing (`escrow` → `refunded`)
- **Milestone payments**: one `Payment` per milestone (or one for the whole gig if it has none), driven from a payments panel on the gig detail page
- **Razorpay test mode with a built-in mock fallback** (`backend/src/config/razorpay.js`): with no `RAZORPAY_KEY_ID`/`SECRET` set, orders/signature-verification/refunds are all simulated in-process — the full escrow flow works end-to-end with zero real money or external calls, clearly labeled "mock mode" in the UI. Add real **test-mode** keys to exercise the actual Razorpay Checkout widget.
- **Automatic freelancer payout** is simulated as the `release` step — real payouts require a separate KYC'd RazorpayX account, which is out of scope here; swap in RazorpayX transfers behind `releasePayment` when ready.
- **Refund management** — client-initiated refunds on any not-yet-released escrow
- **Transaction history** — `/payments` page (client and freelancer both see their side) with escrow/earned totals

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
| GET | `/api/users` | Public | Advanced freelancer search (`skill`, `city`, `country`, `rateMin`, `rateMax`, `minRating`, `minExperience`, paginated) |
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

### Conversations (Chat)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/conversations` | Private | List your conversations, most recent first |
| POST | `/api/conversations` | Private | Get-or-create a conversation `{ participantId, gigId? }` |
| GET | `/api/conversations/:id/messages` | Private (participant) | Paginated message history |
| POST | `/api/conversations/:id/attachments` | Private (participant) | Upload a chat file (`multipart/form-data`, `file`) |

#### Socket.IO events
Connect with `io(url, { auth: { token } })` using the same JWT as REST.

| Event (client → server) | Payload | Event (server → client) | Payload |
|---|---|---|---|
| `conversation:join` | `conversationId` | `message:new` | full message |
| `conversation:leave` | `conversationId` | `message:notify` | `{ conversationId, message }` (fires even outside the room) |
| `message:send` | `{ conversationId, text, attachments }` (ack callback) | `typing:start` / `typing:stop` | `{ userId, conversationId }` |
| `typing:start` / `typing:stop` | `conversationId` | `message:read` | `{ conversationId, userId }` |
| `message:read` | `{ conversationId }` | `notification:new` | notification doc (any type, see below) |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications` | Private | Paginated list + `unreadCount` |
| PUT | `/api/notifications/:id/read` | Private | Mark one as read |
| PUT | `/api/notifications/read-all` | Private | Mark all as read |

### Payments
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/order` | Client | Create an escrow order for a gig or `milestoneId` |
| POST | `/api/payments/verify` | Client | Verify checkout + move funds into escrow |
| POST | `/api/payments/:id/release` | Client | Release escrowed funds to the freelancer |
| POST | `/api/payments/:id/refund` | Client | Refund an escrowed (not yet released) payment |
| GET | `/api/payments/my` | Private | Your transaction history |
| GET | `/api/payments/gig/:gigId` | Private (participant) | Payments for one gig |
| PUT | `/api/gigs/:id/milestones/:milestoneId/complete` | Freelancer | Mark a milestone complete for client review |
| GET | `/api/gigs/:id/progress-logs` | Private (participant) | Progress-log timeline |
| POST | `/api/gigs/:id/progress-logs` | Freelancer | Post an update `{ message, completionPercentage? }` (`multipart/form-data`, optional `file`) |

### AI Matching
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/matching/gigs/:gigId/recommendations` | Gig Owner/Admin | Top 10 matched freelancers |
| GET | `/api/matching/recommended-gigs` | Freelancer | Top 10 matched open gigs |
| GET | `/api/matching/trending-skills` | Public | Top 10 skills across gigs from the last 30 days |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/analytics` | Admin | Revenue, active freelancers, top categories, job success rate |
| GET | `/api/admin/logs` | Admin | Recent admin action audit log |
| GET | `/api/admin/users` | Admin | List/search users |
| PUT | `/api/admin/users/:id/suspend` | Admin | `{ suspended }` |
| PUT | `/api/admin/users/:id/verify-freelancer` | Admin | Grant the verified badge |
| GET | `/api/admin/gigs` | Admin | List all gigs |
| PUT | `/api/admin/gigs/:id/approve` | Admin | `{ approved }` — show/hide from public listing |
| GET | `/api/admin/payments` | Admin | All transactions |
| GET | `/api/admin/reviews/flagged` | Admin | Reviews flagged by fraud detection |
| GET | `/api/admin/disputes` | Admin | Mediation queue |
| PUT | `/api/admin/disputes/:id/resolve` | Admin | `{ status: 'resolved'\|'rejected', resolution }` |

### Disputes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/disputes` | Private (gig participant) | Raise a dispute `{ gigId, paymentId?, reason, description? }` |
| GET | `/api/disputes/my` | Private | Disputes you raised or that were raised against you |
| GET | `/api/disputes/:id` | Private (participant/admin) | Get one dispute |
| POST | `/api/disputes/:id/evidence` | Private (participant) | Upload evidence (`multipart/form-data`, `file`) |

### Bookings (Scheduler)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/bookings/availability/:freelancerId?date=YYYY-MM-DD` | Public | Hourly slots for that day, marked available/booked |
| POST | `/api/bookings` | Client | Book a slot `{ freelancerId, gigId?, date, startTime, endTime, notes? }` — auto-confirmed |
| GET | `/api/bookings/my` | Private | Your bookings (as client or freelancer) |
| PUT | `/api/bookings/:id/cancel` | Private (participant) | Cancel a booking |

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
7. **MongoDB Atlas Search (optional)** — once on Atlas, you can define a search index over `Gig`/`User` and swap the regex-based queries in `gigController.getGigs`/`userController.searchFreelancers` for a single `$search` aggregation stage for fuzzy/typo-tolerant search — the request/response shape wouldn't need to change.
