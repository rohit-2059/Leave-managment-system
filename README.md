# Leave Management System

A full-stack Employee Leave Management System with role-based dashboards, real-time messaging, complaint handling, and reimbursement workflows.

## Features

### Authentication
- Email/password registration and login
- Google OAuth (Firebase Authentication)
- JWT-based session management
- Role-based access control (Admin, Manager, Employee)

### Employee Dashboard
- **Leave Management** — Apply for leave, view leave balance, track leave history
- **Complaints** — Raise workplace complaints, track complaint status
- **Reimbursements** — Submit reimbursement requests with two-level approval flow
- **Real-time Messaging** — Chat with your manager via Socket.IO

### Manager Dashboard
- **Team Management** — Create teams, assign/remove employees
- **Leave Approvals** — Review and approve/reject team leave requests
- **Complaint Handling** — Review team complaints
- **Team Reimbursements** — Approve/reject employee reimbursement requests (forwarded to admin)
- **Own Reimbursements** — Submit personal reimbursement requests (admin-only approval)
- **Real-time Messaging** — Chat with team employees

### Admin Dashboard
- **User Management** — Create managers/employees, manage all users
- **Leave Allocations** — Configure leave quotas per employee
- **Reimbursement Approvals** — Final approval for all reimbursement requests
- **Overview** — System-wide stats and recent activity

### Reimbursement Approval Flow
| Applicant | Step 1 | Step 2 |
|-----------|--------|--------|
| Employee  | Manager approves → | Admin approves (final) |
| Manager   | — | Admin approves (final) |

## Tech Stack

### Backend
- **Runtime:** Node.js with Express.js (ESM modules)
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT + Firebase Admin SDK
- **Real-time:** Socket.IO
- **Password Hashing:** bcryptjs

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** FontAwesome
- **HTTP Client:** Axios
- **Routing:** React Router v7
- **Toasts:** Sonner
- **Charts:** Recharts
- **Real-time:** socket.io-client

## Project Structure

```
├── backend/
│   ├── config/          # Database & Firebase configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/       # Auth middleware (JWT verification)
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Leave.js
│   │   ├── LeaveAllocation.js
│   │   ├── Team.js
│   │   ├── Complaint.js
│   │   ├── Message.js
│   │   └── Reimbursement.js
│   ├── routes/          # Express route definitions
│   ├── scripts/         # Seed scripts
│   └── index.js         # Server entry point (Express + Socket.IO)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── admin/       # Admin dashboard components
│       │   ├── employee/    # Employee dashboard components
│       │   └── manager/     # Manager dashboard components
│       ├── context/         # Auth & Socket contexts
│       ├── pages/           # Login, Register, Dashboard pages
│       └── services/        # API service layer (Axios)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Firebase project (for Google OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/rohit-2059/Leave-managment-system.git
cd Leave-managment-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in your values in `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/leave-management
JWT_SECRET=your_secret_key
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```

Place your Firebase service account JSON in `backend/config/serviceAccountKey.json`.

Seed the admin user:

```bash
npm run seed:admin
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in your Firebase config in `.env`:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=/api
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/me` | Get current user |

### Leaves
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/leaves` | Employee |
| GET | `/api/leaves/my` | Employee |
| GET | `/api/leaves/team` | Manager |
| PUT | `/api/leaves/:id/review` | Manager |

### Complaints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/complaints` | Employee |
| GET | `/api/complaints/my` | Employee |
| GET | `/api/complaints/team` | Manager |
| PUT | `/api/complaints/:id/review` | Manager |

### Reimbursements
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/reimbursements` | Employee, Manager |
| GET | `/api/reimbursements/my` | Employee, Manager |
| PUT | `/api/reimbursements/:id/withdraw` | Employee, Manager |
| GET | `/api/reimbursements/team` | Manager |
| PUT | `/api/reimbursements/:id/manager-review` | Manager |
| GET | `/api/reimbursements/admin` | Admin |
| PUT | `/api/reimbursements/:id/admin-review` | Admin |

### Teams
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/teams` | Manager |
| GET | `/api/teams/my` | Manager |
| GET | `/api/teams/overview` | Manager |
| PUT | `/api/teams/:id/members` | Manager |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/users` | Admin |
| POST | `/api/users/create` | Admin |
| GET | `/api/users/admin-overview` | Admin |
| PUT | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

## Default Roles

| Role | How to Create |
|------|--------------|
| **Admin** | Run `npm run seed:admin` |
| **Manager** | Created by Admin from dashboard |
| **Employee** | Self-registration or created by Admin |

## License

ISC
