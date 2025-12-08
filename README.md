# MemoTap Backend

Voice-to-structured-data API that converts voice recordings into notes, tasks, and reminders using Google Gemini AI.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini API
- **Auth**: JWT + Google OAuth

## Getting Started

### Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB Atlas** account (free tier)
3. **Google Gemini API** key

### Setup

1. **Clone the repository**
   ```bash
   cd memotap-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   PORT=3000
   NODE_ENV=development

   # MongoDB Atlas connection string
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/memotap

   # JWT secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # Google (get from Google AI Studio)
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register with email/password | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/google` | Google OAuth login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Recordings (Core Feature)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/recordings/process` | Upload audio → AI → JSON | Yes |
| GET | `/api/recordings` | Get all recordings | Yes |
| GET | `/api/recordings/:id` | Get single recording | Yes |

### Tasks (CRUD)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get all tasks | Yes |
| GET | `/api/tasks/:id` | Get single task | Yes |
| POST | `/api/tasks` | Create task | Yes |
| PATCH | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |

### Notes (CRUD)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notes` | Get all notes | Yes |
| GET | `/api/notes/:id` | Get single note | Yes |
| POST | `/api/notes` | Create note | Yes |
| PATCH | `/api/notes/:id` | Update note | Yes |
| DELETE | `/api/notes/:id` | Delete note | Yes |

### Reminders (CRUD)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reminders` | Get all reminders | Yes |
| GET | `/api/reminders/:id` | Get single reminder | Yes |
| POST | `/api/reminders` | Create reminder | Yes |
| PATCH | `/api/reminders/:id` | Update reminder | Yes |
| DELETE | `/api/reminders/:id` | Delete reminder | Yes |

## API Examples

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Process Audio Recording (Main Feature)
```bash
POST /api/recordings/process
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <audio file>
```

**Response:**
```json
{
  "success": true,
  "recording": {
    "id": "...",
    "transcription": "Remember to call the dentist tomorrow at 2pm..."
  },
  "extracted": {
    "tasks": [
      {
        "_id": "...",
        "task": "Call the dentist",
        "day": "2024-01-16",
        "hour": "14:00",
        "done": false
      }
    ],
    "notes": [
      {
        "_id": "...",
        "title": "Project Idea",
        "content": "Use microservices architecture"
      }
    ],
    "reminders": [
      {
        "_id": "...",
        "message": "Mom's birthday",
        "remindAt": "2024-01-22T09:00:00.000Z",
        "notified": false
      }
    ]
  }
}
```

### Create Task Manually
```bash
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "task": "Buy groceries",
  "day": "2024-01-15",
  "hour": "10:00"
}
```

### Update Task (Mark as Done)
```bash
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "done": true
}
```

### Get Tasks with Filters
```bash
GET /api/tasks?done=false&day=2024-01-15
Authorization: Bearer <token>
```

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Scripts

```bash
npm run dev    # Start development server with hot reload
npm run build  # Build TypeScript to JavaScript
npm start      # Start production server
```

## Project Structure

```
src/
├── config/
│   ├── db.ts          # MongoDB connection
│   ├── env.ts         # Environment variables
│   └── gemini.ts      # Gemini AI client
├── models/
│   ├── User.ts
│   ├── Task.ts
│   ├── Note.ts
│   ├── Reminder.ts
│   └── Recording.ts
├── routes/
│   ├── auth.routes.ts
│   ├── recording.routes.ts
│   ├── task.routes.ts
│   ├── note.routes.ts
│   └── reminder.routes.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── recording.controller.ts
│   ├── task.controller.ts
│   ├── note.controller.ts
│   └── reminder.controller.ts
├── services/
│   ├── ai.service.ts    # Gemini transcription + extraction
│   └── auth.service.ts  # JWT, password hashing
├── middleware/
│   ├── auth.middleware.ts
│   ├── upload.middleware.ts
│   └── error.middleware.ts
├── types/
│   └── index.ts
└── app.ts              # Express app entry point
```

## Setup External Services

### MongoDB Atlas (Free Tier)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create a new cluster (free M0 tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Add to `.env` as `MONGODB_URI`

### Google Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click "Get API Key"
3. Create a new API key
4. Add to `.env` as `GEMINI_API_KEY`

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth credentials
5. Add client ID to `.env` as `GOOGLE_CLIENT_ID`
