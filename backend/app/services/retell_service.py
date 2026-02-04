import httpx
from app.config import get_settings
from typing import Dict, Any, Optional


class RetellService:
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.retell_api_key
        self.base_url = "https://api.retellai.com/v2"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def create_phone_call(
        self,
        agent_config: Dict[str, Any],
        phone_number: str,
        call_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Initiate a phone call through Retell AI."""

        payload = {
            "from_number": "+1234567890",  # Configure your Retell phone number
            "to_number": phone_number,
            "override_agent_id": None,  # Use custom configuration
            "retell_llm_dynamic_variables": call_metadata,
            "metadata": call_metadata,
            "voice_id": agent_config.get("conversation_config", {}).get("voice_id", "default"),
            "webhook_url": f"{self.settings.backend_url}/api/webhooks/retell"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/create-phone-call",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def get_call_details(self, call_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve call details from Retell AI."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/get-call/{call_id}",
                headers=self.headers,
                timeout=30.0
            )
            if response.status_code == 200:
                return response.json()
            return None

    async def register_llm_websocket(
        self,
        agent_config: Dict[str, Any],
        call_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Register custom LLM websocket for real-time conversation control."""

        payload = {
            "agent_name": agent_config.get("name", "AI Agent"),
            "llm_websocket_url": f"{self.settings.backend_url.replace('http', 'ws')}/ws/llm",
            "begin_message": "Hello! This is an automated check-in call.",
            "general_prompt": agent_config.get("system_prompt", ""),
            "general_tools": [],
            "states": [],
            "inbound_dynamic_variables_webhook_url": None,
            "voice_id": agent_config.get("conversation_config", {}).get("voice_id", "default"),
            "enable_backchannel": agent_config.get("conversation_config", {}).get("enable_backchannel", True),
            "backchannel_frequency": agent_config.get("conversation_config", {}).get("backchannel_frequency", 0.8),
            "enable_filler_words": agent_config.get("conversation_config", {}).get("enable_filler_words", True),
            "interruption_sensitivity": agent_config.get("conversation_config", {}).get("interruption_sensitivity", 0.5),
            "responsiveness": agent_config.get("conversation_config", {}).get("responsiveness", 0.7),
            "ambient_sound": agent_config.get("conversation_config", {}).get("ambient_sound", "office")
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/create-retell-llm",
                headers=self.headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()


retell_service = RetellService()
