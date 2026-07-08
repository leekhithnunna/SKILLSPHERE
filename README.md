# SkillSphere

An AI-powered freelance marketplace connecting clients and freelancers.

---

## Tech Stack

**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT Auth  
**Frontend:** React 18 · Redux Toolkit · React Router v6 · Tailwind CSS · Vite  
**Tooling:** Concurrently · Nodemon · ESLint

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
| POST | `/api/auth/login` | Public | Login, returns JWT |
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
- **Week 3** 🔜 Messaging, notifications, payments
