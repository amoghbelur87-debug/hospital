# Hospital Guardian AI Backend

A minimal Node.js + Express + TypeScript backend scaffold for the Hospital Guardian AI project.

## Setup

1. Change into the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start in development mode:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /health` - health check
- `GET /api/patients` - list patients
- `GET /api/patients/:id` - get patient by id
- `POST /api/patients` - create a patient record
