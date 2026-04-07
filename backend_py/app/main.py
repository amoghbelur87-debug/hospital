"""FastAPI application for Hospital RL environment"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from environments.env import HospitalEnv, EnvConfig

load_dotenv()

app = FastAPI(
    title="Hospital Guardian AI Backend",
    description="RL-based Hospital Management API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global environment instance
current_env: Optional[HospitalEnv] = None


class ResetRequest(BaseModel):
    """Request to reset the environment"""
    seed: Optional[int] = None


class StepRequest(BaseModel):
    """Request to execute one step"""
    action: int = -1  # Patient index to discharge, -1 for no action


class StepResponse(BaseModel):
    """Response from step action"""
    state: Dict[str, Any]
    reward: float
    done: bool
    info: Dict[str, Any]


class ResetResponse(BaseModel):
    """Response from reset action"""
    state: Dict[str, Any]


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Hospital Guardian AI Backend",
        "environment_active": current_env is not None
    }


@app.post("/api/reset", response_model=ResetResponse)
async def reset_environment(request: ResetRequest = None):
    """
    Reset the RL environment to initial state
    
    Returns:
        ResetResponse with initial state
    """
    global current_env
    
    try:
        config = EnvConfig(
            max_steps=100,
            num_icu_beds=10,
            num_general_beds=30,
        )
        current_env = HospitalEnv(config=config)
        state = current_env.reset()
        
        return ResetResponse(state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/step", response_model=StepResponse)
async def step_environment(request: StepRequest):
    """
    Execute one step in the RL environment
    
    Args:
        request: StepRequest with action (patient index to discharge)
    
    Returns:
        StepResponse with new state, reward, done flag, and info
    """
    global current_env
    
    if current_env is None:
        raise HTTPException(
            status_code=400,
            detail="Environment not initialized. Call /api/reset first."
        )
    
    try:
        state, reward, done, info = current_env.step(request.action)
        
        return StepResponse(
            state=state,
            reward=reward,
            done=done,
            info=info
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/state")
async def get_state():
    """Get current environment state without stepping"""
    global current_env
    
    if current_env is None:
        raise HTTPException(
            status_code=400,
            detail="Environment not initialized. Call /api/reset first."
        )
    
    return current_env._get_state()


@app.get("/api/render")
async def render():
    """Get rendered version of current state"""
    global current_env
    
    if current_env is None:
        raise HTTPException(status_code=400, detail="Environment not initialized")
    
    current_env.render()
    return {"message": "Environment state printed to console"}


@app.get("/api/config")
async def get_config():
    """Get current environment configuration"""
    global current_env
    
    if current_env is None:
        raise HTTPException(status_code=400, detail="Environment not initialized")
    
    return {
        "max_steps": current_env.config.max_steps,
        "num_icu_beds": current_env.config.num_icu_beds,
        "num_general_beds": current_env.config.num_general_beds,
        "max_patients": current_env.config.max_patients,
        "arrival_rate": current_env.config.arrival_rate,
        "critical_rate": current_env.config.critical_rate,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run(app, host="0.0.0.0", port=port)
