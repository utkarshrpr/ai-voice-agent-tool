from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import agent_config, calls, webhooks

settings = get_settings()

app = FastAPI(
    title="AI Voice Agent Tool API",
    description="Backend API for configuring and managing AI voice agents for logistics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_config.router)
app.include_router(calls.router)
app.include_router(webhooks.router)


@app.get("/")
async def root():
    return {
        "message": "AI Voice Agent Tool API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
