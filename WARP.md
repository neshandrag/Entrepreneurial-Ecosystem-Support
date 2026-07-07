# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development Setup
```bash
# Install all dependencies
npm run install:all

# Initial setup (creates .env, directories)
npm run setup

# Start both frontend and backend
npm start

# Alternative: Start with concurrently
npm run dev:all
```

### Frontend Commands
```bash
# Development server (port 5173)
npm run dev:frontend

# Build for production
npm run build

# Preview production build
npm run preview

# Lint frontend code
npm run lint
```

### Backend Commands
```bash
# Development server (port 5000)
npm run dev:backend

# Build TypeScript
cd backend && npm run build

# Start production server
cd backend && npm start

# Run tests
cd backend && npm test

# Seed admin user
cd backend && npm run seed:admin

# Lint backend code
cd backend && npm run lint
```

## Architecture

### High-Level Structure
This is a full-stack startup incubation platform (CITBIF) with:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (port 5173)
- **Backend**: Node.js + Express + TypeScript (port 5000)  
- **Databases**: MongoDB (primary) + PostgreSQL (analytics/reporting)
- **Authentication**: JWT-based with role-based access control

### Key Directories
```
/src/                    # React frontend
  /components/           # React components
  /hooks/               # Custom React hooks
  /services/            # API service functions
  /types/               # TypeScript type definitions

/backend/src/            # Node.js backend
  /config/              # Database & environment config
  /middleware/          # Express middleware (auth, validation, etc.)
  /models/              # MongoDB/Mongoose models
  /routes/              # API route handlers
  /utils/               # Helper utilities
```

### Authentication & Roles
- **Admin**: Full system access via `/admin/dashboard`
- **Enterprise/Individual**: Startup applications via `/startup/dashboard`
- Role-based redirects implemented in login responses
- JWT tokens with refresh token support

### Database Setup
Dual database architecture:
- **MongoDB**: Primary application data (users, startups, profiles)
- **PostgreSQL**: Analytics and reporting data

Connection strings configured in `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/CITBIF
PG_HOST=localhost
PG_DATABASE=postgres
PG_USER=postgres
PG_PASSWORD=lovebird@2809
PG_PORT=5432
```

### API Architecture
RESTful APIs with consistent response format:
```json
{
  "success": boolean,
  "message": string,
  "data": object
}
```

Key route groups:
- `/api/auth/*` - Authentication (login, signup, admin login)
- `/api/admin/*` - Admin management (users, startups, settings)
- `/api/startups/*` - Startup CRUD and dashboard endpoints
- `/api/profile/*` - User profile management (6-step wizard)
- `/api/mentors/*`, `/api/investors/*`, `/api/events/*` - Resource management

### Application Flow
1. **User Registration**: Role-based signup (individual/enterprise/admin)
2. **Profile Completion**: 6-step wizard (personal info → enterprise info → incubation details → documents → pitch deck → funding)
3. **Startup Application**: Submit application for review
4. **Admin Review**: Approve/reject with mentor/investor assignment
5. **Incubation**: Track milestones, progress, and resources

### Key Models
- **User**: Authentication and basic info
- **Profile**: Detailed 6-step profile data  
- **Startup**: Application and incubation data
- **Mentor/Investor**: Resource management
- **Document**: File handling and storage

### Development Notes
- Frontend uses mock APIs initially, can be configured for real backend
- Backend includes comprehensive validation with Joi schemas
- File upload support with multer (documents, images)
- Email notifications via nodemailer
- Comprehensive error handling and logging
- Rate limiting and security middleware

### Environment Configuration
Backend requires `.env` file with database credentials, JWT secrets, SMTP settings, and CORS configuration. Use `backend/env.example` as template.

Admin user seeding available via `npm run seed:admin` in backend directory.