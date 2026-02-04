from typing import Dict, Any, List
from app.services.llm_service import llm_service


class ConversationManager:
    def __init__(self):
        self.active_conversations: Dict[str, Dict[str, Any]] = {}

    def initialize_conversation(
        self,
        call_id: str,
        agent_config: Dict[str, Any],
        call_context: Dict[str, Any]
    ):
        """Initialize a new conversation session."""
        self.active_conversations[call_id] = {
            "agent_config": agent_config,
            "call_context": call_context,
            "history": [],
            "state": {
                "emergency_detected": False,
                "data_collected": {},
                "current_topic": "greeting"
            }
        }

    async def process_user_message(
        self,
        call_id: str,
        user_message: str
    ) -> str:
        """Process user message and generate agent response."""

        if call_id not in self.active_conversations:
            return "I'm sorry, there was an error with this call."

        conversation = self.active_conversations[call_id]

        # Add user message to history
        conversation["history"].append({
            "role": "user",
            "content": user_message
        })

        # Check for emergency
        if not conversation["state"]["emergency_detected"]:
            emergency_result = await llm_service.detect_emergency(user_message)
            if emergency_result.get("is_emergency") and emergency_result.get("confidence", 0) > 0.7:
                conversation["state"]["emergency_detected"] = True
                conversation["state"]["current_topic"] = "emergency"
                response = await self._handle_emergency_pivot(conversation)
            else:
                response = await self._handle_normal_flow(conversation)
        else:
            response = await self._handle_emergency_flow(conversation)

        # Add agent response to history
        conversation["history"].append({
            "role": "assistant",
            "content": response
        })

        return response

    async def _handle_emergency_pivot(self, conversation: Dict[str, Any]) -> str:
        """Handle immediate pivot to emergency protocol."""
        return (
            "I understand this is an emergency situation. First, are you safe right now? "
            "Do you or anyone else need immediate medical attention?"
        )

    async def _handle_emergency_flow(self, conversation: Dict[str, Any]) -> str:
        """Handle conversation flow for emergency scenario."""
        agent_config = conversation["agent_config"]
        call_context = conversation["call_context"]

        emergency_prompt = f"""
{agent_config.get('system_prompt', '')}

EMERGENCY MODE ACTIVE. Priority:
1. Confirm safety status
2. Determine emergency type
3. Collect location
4. Verify load security
5. Assure help is coming

Continue the emergency protocol naturally.
"""

        response = await llm_service.get_next_response(
            emergency_prompt,
            conversation["history"],
            call_context
        )

        return response

    async def _handle_normal_flow(self, conversation: Dict[str, Any]) -> str:
        """Handle normal conversation flow for check-in scenario."""
        agent_config = conversation["agent_config"]
        call_context = conversation["call_context"]

        response = await llm_service.get_next_response(
            agent_config.get("system_prompt", ""),
            conversation["history"],
            call_context
        )

        return response

    def get_conversation_history(self, call_id: str) -> List[Dict[str, str]]:
        """Get full conversation history for a call."""
        if call_id in self.active_conversations:
            return self.active_conversations[call_id]["history"]
        return []

    def end_conversation(self, call_id: str) -> List[Dict[str, str]]:
        """End conversation and return final history."""
        history = self.get_conversation_history(call_id)
        if call_id in self.active_conversations:
            del self.active_conversations[call_id]
        return history


conversation_manager = ConversationManager()
