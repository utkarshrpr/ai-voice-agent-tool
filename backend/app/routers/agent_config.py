from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.agent_config import AgentConfig, AgentConfigCreate, AgentConfigUpdate
from app.services.supabase_service import SupabaseService
from app.services.retell_service import RetellService

router = APIRouter()


@router.post("/", response_model=AgentConfig, status_code=status.HTTP_201_CREATED)
async def create_agent_config(agent_data: AgentConfigCreate):
    """
    Create a new agent configuration.
    This will also create the agent in Retell AI.
    """
    try:
        db = SupabaseService()
        retell = RetellService()

        # Create agent in database first
        agent = await db.create_agent_config(agent_data)

        # Create agent in Retell AI
        try:
            retell_agent_id = await retell.create_agent(agent)
            # Update database with Retell agent ID
            await db.update_retell_agent_id(agent.id, retell_agent_id)
            # Refresh agent data
            agent = await db.get_agent_config(agent.id)
        except Exception as e:
            # If Retell creation fails, log but don't fail the request
            print(f"Warning: Failed to create Retell agent: {e}")

        return agent

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create agent configuration: {str(e)}"
        )


@router.get("/", response_model=List[AgentConfig])
async def list_agent_configs(active_only: bool = False):
    """List all agent configurations."""
    try:
        db = SupabaseService()
        agents = await db.list_agent_configs(active_only=active_only)
        return agents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list agent configurations: {str(e)}"
        )


@router.get("/{agent_id}", response_model=AgentConfig)
async def get_agent_config(agent_id: str):
    """Get a specific agent configuration."""
    try:
        db = SupabaseService()
        agent = await db.get_agent_config(agent_id)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )

        return agent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get agent configuration: {str(e)}"
        )


@router.put("/{agent_id}", response_model=AgentConfig)
async def update_agent_config(agent_id: str, update_data: AgentConfigUpdate):
    """
    Update an agent configuration.
    This will also update the agent in Retell AI if it exists.
    """
    try:
        db = SupabaseService()
        retell = RetellService()

        # Get existing agent
        existing_agent = await db.get_agent_config(agent_id)
        if not existing_agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )

        # Update in database
        agent = await db.update_agent_config(agent_id, update_data)

        # Update in Retell AI if agent exists there
        if agent.retell_agent_id:
            try:
                await retell.update_agent(agent.retell_agent_id, agent)
            except Exception as e:
                print(f"Warning: Failed to update Retell agent: {e}")

        return agent

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update agent configuration: {str(e)}"
        )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_config(agent_id: str):
    """Delete an agent configuration."""
    try:
        db = SupabaseService()

        # Check if agent exists
        agent = await db.get_agent_config(agent_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )

        # Delete from database (Retell agent can stay active)
        success = await db.delete_agent_config(agent_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete agent configuration"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete agent configuration: {str(e)}"
        )
