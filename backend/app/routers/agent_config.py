from fastapi import APIRouter, HTTPException
from app.models.agent_config import AgentConfig, AgentConfigCreate, AgentConfigUpdate
from app.services.supabase_service import supabase_service
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/agent-configs", tags=["agent-configs"])


@router.post("", response_model=AgentConfig)
async def create_agent_config(config: AgentConfigCreate):
    """Create a new agent configuration."""
    config_data = config.model_dump()
    config_data["conversation_config"] = config_data["conversation_config"].model_dump()
    config_data["created_at"] = datetime.utcnow().isoformat()
    config_data["updated_at"] = datetime.utcnow().isoformat()

    result = await supabase_service.create_agent_config(config_data)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create agent config")

    return result


@router.get("", response_model=List[AgentConfig])
async def list_agent_configs():
    """List all agent configurations."""
    return await supabase_service.list_agent_configs()


@router.get("/{config_id}", response_model=AgentConfig)
async def get_agent_config(config_id: str):
    """Get a specific agent configuration."""
    result = await supabase_service.get_agent_config(config_id)
    if not result:
        raise HTTPException(status_code=404, detail="Agent config not found")
    return result


@router.put("/{config_id}", response_model=AgentConfig)
async def update_agent_config(config_id: str, config: AgentConfigUpdate):
    """Update an agent configuration."""
    update_data = {k: v for k, v in config.model_dump(exclude_unset=True).items() if v is not None}

    if "conversation_config" in update_data:
        update_data["conversation_config"] = update_data["conversation_config"].model_dump()

    result = await supabase_service.update_agent_config(config_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Agent config not found")

    return result


@router.delete("/{config_id}")
async def delete_agent_config(config_id: str):
    """Delete an agent configuration."""
    success = await supabase_service.delete_agent_config(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent config not found")

    return {"message": "Agent config deleted successfully"}
