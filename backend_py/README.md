# Hospital Guardian AI - Python Backend

A FastAPI-based Reinforcement Learning backend for hospital resource management simulation.

## 🚀 Features

- **RL Environment** - Hospital management simulation with gym-like API (reset, step)
- **FastAPI** - Modern, fast async Python web framework
- **Patient Management** - ICU and general bed allocation
- **Resource Optimization** - RL agents can train on optimal bed utilization
- **Real-time State** - Complete hospital state visibility

## 📋 Environment Overview

The `HospitalEnv` simulates a hospital with:
- **ICU Beds**: Limited high-care beds for critical patients
- **General Beds**: Standard beds for stable patients
- **Patient Arrivals**: Stochastic arrival of stable and critical patients
- **Treatment Duration**: Variable time to discharge
- **Reward Function**: Optimize for bed efficiency, reduced wait times, mortality

## 🛠️ Setup

### Prerequisites
- Python 3.8+
- pip or conda

### Installation

```bash
# Navigate to backend_py folder
cd backend_py

# Create virtual environment (recommended)
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
```

## 🚀 Running the Server

```bash
# Development server (with auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000

# Production server
python -m uvicorn app.main:app --host 0.0.0.0 --port 4000
```

Server runs on `http://localhost:4000`

## 📡 API Endpoints

### Health Check
```
GET /health
```
Check if backend is running and environment status.

### Reset Environment
```
POST /api/reset
```
Reset the RL environment to initial state.

**Response:**
```json
{
  "state": {
    "step": 0,
    "total_patients": 0,
    "icu_beds_used": 0,
    "icu_beds_available": 10,
    "general_beds_used": 0,
    "general_beds_available": 30,
    "wait_queue_length": 0,
    "total_admitted": 0,
    "total_discharged": 0,
    "total_deaths": 0,
    "patients": []
  }
}
```

### Step Environment
```
POST /api/step
```
Execute one step in the environment with an action.

**Request Body:**
```json
{
  "action": -1
}
```
- `action`: (int) Patient index to discharge, or `-1` for no action

**Response:**
```json
{
  "state": { /* current state */ },
  "reward": 5.25,
  "done": false,
  "info": {
    "episode_reward": 25.5
  }
}
```

### Get Current State
```
GET /api/state
```
Get the current environment state without stepping.

### Get Configuration
```
GET /api/config
```
Get the environment configuration parameters.

### Render Environment
```
GET /api/render
```
Print current state to console and return confirmation.

## 🤖 Using with RL Agents

### Example: Basic Agent Loop

```python
import requests
import numpy as np

API_URL = "http://localhost:4000"

# Reset
response = requests.post(f"{API_URL}/api/reset")
state = response.json()["state"]

# Run episode
for step in range(100):
    # Simple random action
    action = np.random.randint(-1, len(state["patients"]))
    
    # Step
    response = requests.post(f"{API_URL}/api/step", json={"action": action})
    result = response.json()
    
    state = result["state"]
    reward = result["reward"]
    done = result["done"]
    
    print(f"Step {step}: Reward={reward:.2f}")
    
    if done:
        break
```

## 🏗️ Project Structure

```
backend_py/
├── app/
│   ├── __init__.py
│   └── main.py           # FastAPI application
├── environments/
│   ├── __init__.py
│   └── env.py            # RL Environment class
├── requirements.txt      # Python dependencies
├── .env.example         # Example environment variables
└── README.md
```

## 📊 Environment Dynamics

### Actions
- **action**: Patient index (0 to len(patients)-1) to discharge
- **action = -1**: No discharge action

### States
Each step returns:
- `step`: Current step number
- `icu_beds_used`: ICU beds occupied
- `general_beds_used`: General beds occupied
- `wait_queue_length`: Patients waiting for bed assignment
- `total_admitted`: Cumulative patients admitted
- `total_discharged`: Successfully discharged
- `total_deaths`: Patients who died
- `patients`: List of current patients with details

### Rewards
Reward function optimizes for:
- **+10**: Successful patient discharge
- **+0.5**: Maintaining stability each step
- **-1.0**: Each patient in waiting queue
- **-0.5**: Each critical patient in hospital
- **+0.1**: Each available ICU bed (efficiency)

## 🧪 Testing the Environment

```bash
# Run the environment standalone
python environments/env.py

# This will run a 5-step simulation with random actions
```

## 🔄 Integrating with Frontend

Update frontend `.env`:
```
VITE_API_URL=http://localhost:4000
```

The RL environment state is compatible with the frontend's simulation display.

## 📦 Environment Parameters (EnvConfig)

```python
EnvConfig(
    max_steps=100,              # Episode length
    num_icu_beds=10,           # ICU capacity
    num_general_beds=30,       # General bed capacity
    max_patients=50,           # System capacity
    arrival_rate=0.3,          # New arrivals per step
    critical_rate=0.2,         # Probability of critical patient
    treatment_duration_mean=20 # Average treatment steps
)
```

## 🚀 Deployment

### Using Gunicorn (Production)
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

### Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
```

## 📝 License

MIT

---

**Next Steps:**
- Train RL agents on the environment
- Integrate with DQN/PPO algorithms
- Add more complex hospital dynamics
- Connect to frontend for visualization
