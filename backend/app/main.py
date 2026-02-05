import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import agent_config, calls, webhooks
from app.services.call_poller import CallPollerService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize call poller
call_poller = CallPollerService(poll_interval=5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting AI Voice Agent Tool API")
    await call_poller.start()
    yield
    # Shutdown
    logger.info("Shutting down AI Voice Agent Tool API")
    await call_poller.stop()


# Initialize FastAPI app
app = FastAPI(
    title="AI Voice Agent Tool API",
    description="Backend API for managing AI voice agents and web calls",
    version="1.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agent_config.router, prefix="/api/agents", tags=["Agent Configuration"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Voice Agent Tool API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    llm_configured = settings.validate_llm_config()

    return {
        "status": "healthy",
        "environment": settings.environment,
        "services": {
            "supabase": bool(settings.supabase_url and settings.supabase_key),
            "retell": bool(settings.retell_api_key),
            "llm": llm_configured,
            "call_poller": call_poller.running
        },
        "poller": {
            "enabled": call_poller.running,
            "interval_seconds": call_poller.poll_interval
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.debug)
