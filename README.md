# SkillSphere

An AI-powered freelance marketplace connecting clients and freelancers.

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Redux Toolkit, React Router DOM, Axios
- **Backend**: Node.js, Express.js, MongoDB + Mongoose, JWT Authentication, bcryptjs

## Project Structure

```
skillsphere/
├── backend/          # Express.js API server (port 5000)
├── frontend/         # React/Vite SPA (port 5173)
├── package.json      # Root scripts using concurrently
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

### Installation

```bash
# Install all dependencies (root + backend + frontend)
npm run install-all
```

### Environment Setup

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillsphere
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
```

### Running in Development

```bash
# Run both backend and frontend concurrently
npm run dev

# Or run individually
npm run backend    # http://localhost:5000
npm run frontend   # http://localhost:5173
```

### Production Build

```bash
# Build frontend
npm run build

# Start backend (serves frontend build at /)
npm start
```

## API Endpoints

### Auth
| Method | Endpoint              | Description          | Auth Required |
|--------|-----------------------|----------------------|---------------|
| POST   | /api/auth/register    | Register new user    | No            |
| POST   | /api/auth/login       | Login user           | No            |
| POST   | /api/auth/logout      | Logout user          | No            |
| GET    | /api/auth/me          | Get current user     | Yes           |

### Users / Profile
| Method | Endpoint              | Description          | Auth Required |
|--------|-----------------------|----------------------|---------------|
| GET    | /api/users/profile    | Get current profile  | Yes           |
| PUT    | /api/users/profile    | Update profile       | Yes           |

## User Roles

- `client` — Posts jobs and hires freelancers
- `freelancer` — Offers services and bids on jobs
- `admin` — Platform administration
