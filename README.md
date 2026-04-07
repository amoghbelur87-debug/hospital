# Hospital Guardian AI

An AI-powered hospital management simulation and patient tracking system built with React, TypeScript, and Node.js.

## 🚀 Features

- **CareFlow Simulation Engine** - Hospital workflow optimization simulator with configurable difficulty levels
- **Patient Management System** - Full-stack REST API for patient data management
- **Real-time Dashboard** - Interactive charts and stats for hospital operations
- **Type-Safe Architecture** - End-to-end TypeScript for reliability
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
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── models/       # Data models
│   │   └── index.ts      # Server entry point
│   ├── package.json
│   └── tsconfig.json
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

**Backend:**
- Node.js + Express
- TypeScript
- Zod for schema validation
- CORS enabled

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

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

### Backend Setup

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

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient

**Create Patient Payload:**
```json
{
  "name": "John Doe",
  "age": 45,
  "condition": "stable"
}
```

## 🔧 Environment Variables

Create a `.env` file in the root (frontend) and `backend/.env`:

**.env (Frontend)**
```
VITE_API_URL=http://localhost:4000
```

**backend/.env**
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

### Backend
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
