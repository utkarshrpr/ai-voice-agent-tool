import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.models.agent_config import AgentConfig


class RetellService:
    """Service for interacting with Retell AI API."""

    BASE_URL = "https://api.retellai.com"
    BASE_URL_V2 = "https://api.retellai.com/v2"

    def __init__(self):
        self.api_key = settings.retell_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def create_agent(self, agent_config: AgentConfig) -> str:
        """
        Create an agent in Retell AI.
        First creates a Retell LLM with the system prompt, then creates the agent.
        Returns the Retell agent ID.
        """
        async with httpx.AsyncClient() as client:
            # Step 1: Create Retell LLM with the system prompt
            llm_payload = {
                "general_prompt": agent_config.system_prompt,
                "general_tools": [],
                "starting_sentence": "Hi, this is dispatch calling.",
                "model": "gpt-4o-mini",
                "enable_backchannel": agent_config.conversation_config.enable_backchannel,
                "backchannel_frequency": agent_config.conversation_config.backchannel_frequency,
                "backchannel_words": ["uh-huh", "yeah", "right", "okay"] if agent_config.conversation_config.enable_filler_words else [],
                "responsiveness": agent_config.conversation_config.responsiveness,
            }

            llm_response = await client.post(
                f"{self.BASE_URL}/create-retell-llm",
                json=llm_payload,
                headers=self.headers,
                timeout=30.0
            )
            llm_response.raise_for_status()
            llm_data = llm_response.json()
            llm_id = llm_data["llm_id"]

            # Step 2: Create agent with the LLM
            agent_payload = {
                "agent_name": agent_config.name,
                "voice_id": agent_config.conversation_config.voice_id,
                "language": "en-US",
                "response_engine": {
                    "type": "retell-llm",
                    "llm_id": llm_id
                },
                "interruption_sensitivity": agent_config.conversation_config.interruption_sensitivity,
            }

            agent_response = await client.post(
                f"{self.BASE_URL}/create-agent",
                json=agent_payload,
                headers=self.headers,
                timeout=30.0
            )
            agent_response.raise_for_status()

            data = agent_response.json()
            return data["agent_id"]

    async def update_agent(self, retell_agent_id: str, agent_config: AgentConfig) -> None:
        """
        Update an agent in Retell AI.
        This updates both the agent properties and the LLM system prompt.
        """
        async with httpx.AsyncClient() as client:
            # Step 1: Get current agent details to retrieve LLM ID
            get_response = await client.get(
                f"{self.BASE_URL}/get-agent/{retell_agent_id}",
                headers=self.headers,
                timeout=30.0
            )
            get_response.raise_for_status()
            agent_data = get_response.json()

            # Extract LLM ID from response engine
            llm_id = None
            if "response_engine" in agent_data:
                response_engine = agent_data["response_engine"]
                if response_engine.get("type") == "retell-llm" and "llm_id" in response_engine:
                    llm_id = response_engine["llm_id"]

            # Step 2: Update LLM with new prompt and configuration
            if llm_id:
                llm_payload = {
                    "general_prompt": agent_config.system_prompt,
                    "general_tools": [],
                    "starting_sentence": "Hi, this is dispatch calling.",
                    "model": "gpt-4o-mini",
                    "enable_backchannel": agent_config.conversation_config.enable_backchannel,
                    "backchannel_frequency": agent_config.conversation_config.backchannel_frequency,
                    "backchannel_words": ["uh-huh", "yeah", "right", "okay"] if agent_config.conversation_config.enable_filler_words else [],
                    "responsiveness": agent_config.conversation_config.responsiveness,
                }

                print(f"Updating Retell LLM {llm_id} with config: {llm_payload}")

                llm_response = await client.patch(
                    f"{self.BASE_URL}/update-retell-llm/{llm_id}",
                    json=llm_payload,
                    headers=self.headers,
                    timeout=30.0
                )
                llm_response.raise_for_status()
                print(f"LLM update response: {llm_response.status_code}")

            # Step 3: Update agent properties
            agent_payload = {
                "agent_name": agent_config.name,
                "voice_id": agent_config.conversation_config.voice_id,
                "interruption_sensitivity": agent_config.conversation_config.interruption_sensitivity,
            }

            print(f"Updating Retell agent {retell_agent_id} with config: {agent_payload}")

            agent_response = await client.patch(
                f"{self.BASE_URL}/update-agent/{retell_agent_id}",
                json=agent_payload,
                headers=self.headers,
                timeout=30.0
            )
            agent_response.raise_for_status()
            print(f"Agent update response: {agent_response.status_code}")

    async def create_web_call(
        self,
        agent_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a web call and return access token.
        This is the critical method for browser-based calling.
        Uses Retell AI v2 API endpoint.
        """
        async with httpx.AsyncClient() as client:
            payload = {
                "agent_id": agent_id,
                "metadata": metadata or {},
                "retell_llm_dynamic_variables": metadata or {}
            }

            response = await client.post(
                f"{self.BASE_URL_V2}/create-web-call",
                json=payload,
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()

            data = response.json()
            return {
                "call_id": data.get("call_id"),
                "access_token": data.get("access_token"),
                "sample_rate": 24000  # Standard sample rate for web calls
            }

    async def get_call_details(self, call_id: str) -> Dict[str, Any]:
        """Get call details from Retell AI using v2 API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL_V2}/get-call/{call_id}",
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def list_calls(self, limit: int = 100) -> Dict[str, Any]:
        """List calls from Retell AI."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/list-calls",
                params={"limit": limit},
                headers=self.headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
