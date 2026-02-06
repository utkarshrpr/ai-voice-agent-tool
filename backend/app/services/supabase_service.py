from supabase import create_client, Client
from typing import List, Optional, Dict, Any
from app.config import settings
from app.models.agent_config import AgentConfig, AgentConfigCreate, AgentConfigUpdate
from app.models.call import Call, CallCreate, CallUpdate


class SupabaseService:
    """Service for interacting with Supabase database."""

    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )

    # Agent Configuration Methods

    async def create_agent_config(self, agent_data: AgentConfigCreate) -> AgentConfig:
        """Create a new agent configuration."""
        data = agent_data.model_dump()
        data["conversation_config"] = agent_data.conversation_config.model_dump()

        response = self.client.table("agent_configs").insert(data).execute()
        return AgentConfig(**response.data[0])

    async def get_agent_config(self, agent_id: str) -> Optional[AgentConfig]:
        """Get an agent configuration by ID."""
        response = self.client.table("agent_configs").select("*").eq("id", agent_id).execute()

        if not response.data:
            return None

        return AgentConfig(**response.data[0])

    async def list_agent_configs(self, active_only: bool = False) -> List[AgentConfig]:
        """List all agent configurations."""
        query = self.client.table("agent_configs").select("*")

        if active_only:
            query = query.eq("is_active", True)

        response = query.order("created_at", desc=True).execute()
        return [AgentConfig(**item) for item in response.data]

    async def update_agent_config(
        self,
        agent_id: str,
        update_data: AgentConfigUpdate
    ) -> Optional[AgentConfig]:
        """Update an agent configuration."""
        data = update_data.model_dump(exclude_unset=True)

        # conversation_config is already a dict after model_dump(), no need to dump again

        if not data:
            return await self.get_agent_config(agent_id)

        response = self.client.table("agent_configs").update(data).eq("id", agent_id).execute()

        if not response.data:
            return None

        return AgentConfig(**response.data[0])

    async def delete_agent_config(self, agent_id: str) -> bool:
        """Delete an agent configuration."""
        response = self.client.table("agent_configs").delete().eq("id", agent_id).execute()
        return len(response.data) > 0

    async def update_retell_agent_id(self, agent_id: str, retell_agent_id: str) -> None:
        """Update the Retell agent ID for an agent configuration."""
        self.client.table("agent_configs").update(
            {"retell_agent_id": retell_agent_id}
        ).eq("id", agent_id).execute()

    # Call Methods

    async def create_call(self, call_data: CallCreate) -> Call:
        """Create a new call record."""
        data = call_data.model_dump()
        response = self.client.table("calls").insert(data).execute()
        return Call(**response.data[0])

    async def get_call(self, call_id: str) -> Optional[Call]:
        """Get a call by ID."""
        response = self.client.table("calls").select("*").eq("id", call_id).execute()

        if not response.data:
            return None

        return Call(**response.data[0])

    async def get_call_by_retell_id(self, retell_call_id: str) -> Optional[Call]:
        """Get a call by Retell call ID."""
        response = self.client.table("calls").select("*").eq(
            "retell_call_id", retell_call_id
        ).execute()

        if not response.data:
            return None

        return Call(**response.data[0])

    async def list_calls(
        self,
        agent_config_id: Optional[str] = None,
        status_filter: Optional[str] = None,
        driver_name: Optional[str] = None,
        created_after: Optional[str] = None,
        created_before: Optional[str] = None,
        limit: int = 50
    ) -> List[Call]:
        """List calls with optional filtering."""
        query = self.client.table("calls").select("*")

        if agent_config_id:
            query = query.eq("agent_config_id", agent_config_id)

        if status_filter:
            query = query.eq("status", status_filter)

        if driver_name:
            query = query.ilike("driver_name", f"%{driver_name}%")

        if created_after:
            query = query.gte("created_at", created_after)

        if created_before:
            query = query.lte("created_at", created_before)

        response = query.order("created_at", desc=True).limit(limit).execute()
        return [Call(**item) for item in response.data]

    async def update_call(self, call_id: str, update_data: CallUpdate) -> Optional[Call]:
        """Update a call record."""
        data = update_data.model_dump(exclude_unset=True)

        # Convert transcript list to JSON-serializable format
        if "transcript" in data and data["transcript"]:
            data["transcript"] = [entry.model_dump() if hasattr(entry, "model_dump") else entry for entry in data["transcript"]]

        # Convert datetime objects to ISO format strings
        from datetime import datetime
        if "started_at" in data and isinstance(data["started_at"], datetime):
            data["started_at"] = data["started_at"].isoformat()
        if "ended_at" in data and isinstance(data["ended_at"], datetime):
            data["ended_at"] = data["ended_at"].isoformat()

        if not data:
            return await self.get_call(call_id)

        response = self.client.table("calls").update(data).eq("id", call_id).execute()

        if not response.data:
            return None

        return Call(**response.data[0])

    async def delete_call(self, call_id: str) -> bool:
        """Delete a call record."""
        response = self.client.table("calls").delete().eq("id", call_id).execute()
        return len(response.data) > 0

    # Call Events Methods

    async def create_call_event(
        self,
        call_id: str,
        event_type: str,
        event_data: Dict[str, Any]
    ) -> None:
        """Create a call event for logging."""
        self.client.table("call_events").insert({
            "call_id": call_id,
            "event_type": event_type,
            "event_data": event_data
        }).execute()
