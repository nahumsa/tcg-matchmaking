from fastapi import FastAPI

app = FastAPI(title="Swiss Matchmaking System")

@app.get("/health")
def health_check():
    return {"status": "ok"}
