from supabase import create_client, Client
from app.config import get_settings
from typing import Optional, List, Dict, Any
from datetime import datetime


class SupabaseService:
    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(settings.supabase_url, settings.supabase_key)

    # Agent Config operations
    async def create_agent_config(self, config_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.table("agent_configs").insert(config_data).execute()
        return response.data[0] if response.data else None

    async def get_agent_config(self, config_id: str) -> Optional[Dict[str, Any]]:
        response = self.client.table("agent_configs").select("*").eq("id", config_id).execute()
        return response.data[0] if response.data else None

    async def list_agent_configs(self) -> List[Dict[str, Any]]:
        response = self.client.table("agent_configs").select("*").order("created_at", desc=True).execute()
        return response.data if response.data else []

    async def update_agent_config(self, config_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = self.client.table("agent_configs").update(update_data).eq("id", config_id).execute()
        return response.data[0] if response.data else None

    async def delete_agent_config(self, config_id: str) -> bool:
        response = self.client.table("agent_configs").delete().eq("id", config_id).execute()
        return bool(response.data)

    # Call operations
    async def create_call(self, call_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.table("calls").insert(call_data).execute()
        return response.data[0] if response.data else None

    async def get_call(self, call_id: str) -> Optional[Dict[str, Any]]:
        response = self.client.table("calls").select("*").eq("id", call_id).execute()
        return response.data[0] if response.data else None

    async def list_calls(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        response = (
            self.client.table("calls")
            .select("*")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return response.data if response.data else []

    async def update_call(self, call_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        response = self.client.table("calls").update(update_data).eq("id", call_id).execute()
        return response.data[0] if response.data else None

    # Call Event operations
    async def create_call_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.client.table("call_events").insert(event_data).execute()
        return response.data[0] if response.data else None

    async def list_call_events(self, call_id: str) -> List[Dict[str, Any]]:
        response = (
            self.client.table("call_events")
            .select("*")
            .eq("call_id", call_id)
            .order("timestamp", desc=False)
            .execute()
        )
        return response.data if response.data else []


supabase_service = SupabaseService()
