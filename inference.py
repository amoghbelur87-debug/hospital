#!/usr/bin/env python3
"""
Hugging Face OpenEnv Inference API for Hospital Guardian AI
"""
import os
import sys
import json
from typing import Dict, Any, Optional

# Add backend_py to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend_py'))

from environments.env import HospitalEnv, EnvConfig

# Global environment instance
current_env: Optional[HospitalEnv] = None

def reset_environment() -> Dict[str, Any]:
    """Reset the RL environment"""
    global current_env
    try:
        config = EnvConfig(
            max_steps=100,
            num_icu_beds=10,
            num_general_beds=30,
        )
        current_env = HospitalEnv(config=config)
        state = current_env.reset()
        return {"status": "success", "state": state}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def step_environment(action: int) -> Dict[str, Any]:
    """Execute one step in the environment"""
    global current_env

    if current_env is None:
        return {"status": "error", "message": "Environment not initialized. Call reset first."}

    try:
        state, reward, done, info = current_env.step(action)
        return {
            "status": "success",
            "state": state,
            "reward": reward,
            "done": done,
            "info": info
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_state() -> Dict[str, Any]:
    """Get current environment state"""
    global current_env

    if current_env is None:
        return {"status": "error", "message": "Environment not initialized"}

    try:
        state = current_env._get_state()
        return {"status": "success", "state": state}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def setup():
    """Initialize the environment on startup"""
    print("Setting up Hospital Guardian AI environment...")
    reset_environment()
    print("Environment initialized successfully!")

def inference(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main inference function for Hugging Face OpenEnv

    Expected request format:
    {
        "action": "reset|step|get_state",
        "data": {...}  # Additional data for the action
    }
    """
    try:
        action = request.get("action", "")
        data = request.get("data", {})

        if action == "reset":
            return reset_environment()

        elif action == "step":
            action_value = data.get("action", -1)
            if not isinstance(action_value, int):
                return {"status": "error", "message": "action must be an integer"}
            return step_environment(action_value)

        elif action == "get_state":
            return get_state()

        else:
            return {
                "status": "error",
                "message": "Invalid action. Use 'reset', 'step', or 'get_state'"
            }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Initialize on import
setup()

if __name__ == "__main__":
    # Test the inference function
    print("Testing inference...")

    # Test reset
    result = inference({"action": "reset"})
    print(f"Reset result: {result['status']}")

    # Test step
    result = inference({"action": "step", "data": {"action": -1}})
    print(f"Step result: {result['status']}")

    # Test get state
    result = inference({"action": "get_state"})
    print(f"Get state result: {result['status']}")

    print("Inference tests completed!")