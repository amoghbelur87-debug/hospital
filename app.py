from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Hospital Guardian AI Running"}

@app.get("/health")
def health():
    return {"status": "ok"}