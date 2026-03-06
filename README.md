# OpenCode Mission

A full-stack mission management application with user authentication, projects, and tasks.

## Architecture

### Frontend (Next.js 16 + React 19)
- **Framework**: Next.js 16 with App Router
- **UI Library**: shadcn/ui with Tailwind CSS
- **Authentication**: JWT token-based auth with cookies
- **Testing**: Playwright E2E tests

### Backend (Go + Gin + PostgreSQL)
- **Framework**: Gin
- **Database**: PostgreSQL with pgx driver
- **Authentication**: JWT with bcrypt password hashing
- **CORS**: Configured for frontend development

## Quick Start

### Prerequisites

- Go 1.26+
- Node.js 24+
- PostgreSQL 18+
- Docker (optional)

### 1. Start Database

```bash
docker compose up -d postgres valkey
```

### 2. Run Database Migrations

```bash
cd backend
# Run migrations manually or use your migration tool
```

### 3. Start Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

Backend will start on `http://localhost:8080`

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:3000`

### 5. Test the Application

Open http://localhost:3000 in your browser

- Register a new account
- Login with your credentials
- View your profile

## CORS Configuration

CORS is configured on the backend to allow requests from the frontend:

- **Allowed Origins**: `http://localhost:3000`, `http://127.0.0.1:3000`
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers**: Origin, Content-Type, Authorization
- **Credentials**: Enabled

See `backend/CORS_README.md` for detailed configuration.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Projects (requires auth)
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Tasks (requires auth)
- `GET /api/v1/projects/:id/tasks` - List project tasks
- `POST /api/v1/projects/:id/tasks` - Create task
- `GET /api/v1/tasks/:id` - Get task
- `PATCH /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task

## Development

### Frontend Structure
```
frontend/
├── app/              # Next.js App Router pages
│   ├── auth/         # Authentication pages
│   └── page.tsx      # Home page (protected)
├── components/       # React components
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── hooks/            # Custom hooks
├── lib/              # Utilities
│   ├── api.ts        # API client
│   ├── auth.ts       # Auth API functions
│   └── types.ts      # TypeScript types
```

### Backend Structure
```
backend/
├── cmd/
│   └── server/       # Server entry point
├── internal/
│   ├── config/       # Configuration
│   ├── database/     # Database connection
│   ├── handlers/     # HTTP handlers
│   ├── models/       # Data models
│   ├── repository/   # Data access
│   └── services/     # Business logic
├── pkg/
│   └── auth/         # Authentication utilities
└── migrations/       # Database migrations
```

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## Deployment

### Backend
1. Build: `go build -o bin/server ./cmd/server`
2. Run: `./bin/server`

### Frontend
1. Build: `npm run build`
2. Start: `npm start`
