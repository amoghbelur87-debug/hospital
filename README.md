---
title: Hospital Guardian AI
emoji: 🏥
colorFrom: blue
colorTo: green
sdk: docker
sdk_version: python3.11
app_file: inference.py
pinned: false
license: mit
---

# Hospital Guardian AI

An AI-powered hospital management simulation and patient tracking system built with React, TypeScript, and Python with RL.

## 🚀 Features

- **RL Environment** - Hospital resource management with gym-like API for training RL agents
- **CareFlow Simulation Engine** - Hospital workflow optimization simulator with configurable difficulty levels
- **Patient Management System** - Full-stack REST API for patient data management
- **Real-time Dashboard** - Interactive charts and stats for hospital operations
- **Type-Safe Architecture** - End-to-end TypeScript (frontend) and Python (backend)
- **React Query Integration** - Efficient data fetching and caching on the frontend

## 📁 Project Structure

```
hospital-guardian-ai/
├── src/                    # Frontend React app
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── lib/              # Utilities and API client
│   ├── hooks/            # Custom React hooks
│   ├── App.tsx
│   └── main.tsx
├── backend/              # Node.js Express API (Legacy)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── backend_py/           # Python FastAPI + RL Environment ⭐ (NEW)
│   ├── app/
│   │   └── main.py      # FastAPI application
│   ├── environments/
│   │   └── env.py       # HospitalEnv RL environment
│   ├── requirements.txt
│   └── README.md
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## 🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router for navigation
- React Query for data management
- Recharts for data visualization

**Backend (Python - Recommended):**
- FastAPI
- Python 3.8+
- NumPy
- Pydantic for schema validation
- RL Environment (gym-like API with reset/step)

**Backend (Node.js - Legacy):**
- Node.js + Express
- TypeScript
- Zod for schema validation
- CORS enabled

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Python 3.8+ (for RL backend)

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs on `http://localhost:8080` (or next available port)

### Backend Setup - Python (Recommended) ⭐

```bash
# Navigate to Python backend
cd backend_py

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

Backend runs on `http://localhost:4000`

### Backend Setup - Node.js (Legacy)

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Build TypeScript
npm run build
```

Backend runs on `http://localhost:4000`

## 📡 API Endpoints (Python RL Backend)

### Health Check
- `GET /health` - Server health status

### RL Environment
- `POST /api/reset` - Reset environment to initial state
- `POST /api/step` - Execute one step with action
- `GET /api/state` - Get current environment state
- `GET /api/config` - Get environment configuration
- `GET /api/render` - Print current state to console

**Example Step Request:**
```json
{
  "action": 0
}
```

**Example Step Response:**
```json
{
  "state": {
    "step": 5,
    "total_patients": 8,
    "icu_beds_used": 2,
    "general_beds_used": 5,
    "wait_queue_length": 1,
    "patients": [...]
  },
  "reward": 5.25,
  "done": false,
  "info": {"episode_reward": null}
}
```

## 🤖 OpenEnv API (Hugging Face Spaces)

The RL environment is deployed on Hugging Face Spaces using OpenEnv. All interactions go through the `/inference` endpoint.

### Reset Environment
```python
POST /inference
{
  "action": "reset"
}
```

### Step Environment
```python
POST /inference
{
  "action": "step",
  "data": {
    "action": 0  # Patient index to discharge, -1 for no action
  }
}
```

### Get Current State
```python
POST /inference
{
  "action": "get_state"
}
```

**Response Format:**
```json
{
  "status": "success",
  "state": {
    "step": 5,
    "total_patients": 8,
    "icu_beds_used": 2,
    "general_beds_used": 5,
    "wait_queue_length": 1,
    "total_admitted": 0,
    "total_discharged": 0,
    "total_deaths": 0
  },
  "reward": 5.25,
  "done": false
}
```

## 🔧 Environment Variables

Create a `.env` file in the root (frontend) and `backend_py/.env` (or `backend/.env` for legacy):

**.env (Frontend)**
```
VITE_API_URL=http://localhost:4000
```

**backend_py/.env (Python)**
```
PORT=4000
```

**backend/.env (Node.js - Legacy)**
```
PORT=4000
```

## 📦 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Backend (Python)
```bash
cd backend_py

# Development with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 4000
```

### Backend (Node.js - Legacy)
- `npm run dev` - Start with auto-reload (tsx watch)
- `npm run build` - Compile TypeScript
- `npm start` - Start production server

## 🌐 Deployment

### Frontend
The frontend can be deployed to Vercel, Netlify, or any static host:
```bash
npm run build
# Upload the `dist/` folder
```

### Backend
Deploy to services like:
- Heroku
- Railway
- DigitalOcean
- AWS (EC2, Lambda, etc.)

Remember to set environment variables on your hosting platform!

## 📝 License

MIT

## 👥 Contributing

Contributions welcome! Please feel free to submit PRs.

---

**Ready to push?** Make sure:
- [ ] `.env` files are not committed (added to .gitignore)
- [ ] `node_modules/` is ignored
- [ ] Both frontend and backend README.md files are up-to-date
- [ ] Run `npm run build` and `npm run build` (backend) to ensure no errors
