import os

API_BASE_URL = os.getenv("API_BASE_URL")
MODEL_NAME = os.getenv("MODEL_NAME")
HF_TOKEN = os.getenv("HF_TOKEN")

def predict(input_data):
    return {
        "prediction": "ok",
        "input": input_data
    }