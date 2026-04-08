#!/usr/bin/env python3
"""
FastAPI server for Hospital Guardian AI inference
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import inference

app = FastAPI(title="Hospital Guardian AI", description="RL Environment for Hospital Management")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/inference")
async def inference_endpoint(request: dict):
    """
    Inference endpoint for the RL environment
    """
    try:
        result = inference.inference(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy"}

@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {"message": "Hospital Guardian AI Inference API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)