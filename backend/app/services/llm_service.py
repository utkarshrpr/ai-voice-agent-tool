from app.config import get_settings
from typing import Dict, Any, Optional
import json


class LLMService:
    def __init__(self):
        self.settings = get_settings()
        self.provider = self.settings.llm_provider

        if self.provider == "anthropic":
            from anthropic import Anthropic
            self.client = Anthropic(api_key=self.settings.anthropic_api_key)
            self.model = "claude-3-5-sonnet-20241022"
        else:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.settings.openai_api_key)
            self.model = "gpt-4-turbo-preview"

    async def get_next_response(
        self,
        system_prompt: str,
        conversation_history: list[Dict[str, str]],
        call_context: Dict[str, Any]
    ) -> str:
        """Generate next agent response based on conversation history."""
        context_prompt = f"""
Call Context:
- Driver: {call_context.get('driver_name')}
- Load Number: {call_context.get('load_number')}
- Scenario: {call_context.get('scenario_type')}

{system_prompt}

Respond naturally as the agent, keeping the conversation flowing smoothly.
"""

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=context_prompt,
                messages=conversation_history
            )
            return response.content[0].text
        else:
            messages = [{"role": "system", "content": context_prompt}] + conversation_history
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1024
            )
            return response.choices[0].message.content

    async def detect_emergency(self, user_message: str) -> Dict[str, Any]:
        """Detect if message contains emergency indicators."""
        prompt = f"""Analyze this driver message for emergency indicators:
"{user_message}"

Emergency keywords: emergency, accident, breakdown, injured, help, blowout, crash, hurt

Respond with JSON:
{{
    "is_emergency": true/false,
    "emergency_type": "accident" | "breakdown" | "medical" | "tire_blowout" | "other" | null,
    "confidence": 0.0-1.0,
    "reasoning": "brief explanation"
}}"""

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            result_text = response.content[0].text
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            result_text = response.choices[0].message.content

        try:
            return json.loads(result_text)
        except:
            return {"is_emergency": False, "confidence": 0.0}

    async def extract_structured_data(
        self,
        transcript: list[Dict[str, str]],
        scenario_type: str
    ) -> Dict[str, Any]:
        """Extract structured data from conversation transcript."""

        if scenario_type == "check_in":
            schema = """
{
    "call_outcome": "success" | "partial" | "failed",
    "driver_status": "in_transit" | "arrived" | "unloading" | "completed",
    "current_location": "string or null",
    "eta": "string or null",
    "delay_reason": "string or null",
    "unloading_status": "string or null",
    "pod_reminder_acknowledged": true/false
}"""
        else:  # emergency
            schema = """
{
    "call_outcome": "success" | "partial" | "failed",
    "emergency_type": "accident" | "breakdown" | "medical" | "tire_blowout" | "other",
    "safety_status": "safe" | "unsafe" | "unknown",
    "injury_status": "string or null",
    "emergency_location": "string or null",
    "load_secure": true/false/null,
    "escalation_status": "escalated"
}"""

        transcript_text = "\n".join([
            f"{msg['role']}: {msg['content']}" for msg in transcript
        ])

        prompt = f"""Extract structured data from this conversation transcript.

Transcript:
{transcript_text}

Extract data matching this schema:
{schema}

Respond with valid JSON only."""

        if self.provider == "anthropic":
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            result_text = response.content[0].text
        else:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            result_text = response.choices[0].message.content

        try:
            return json.loads(result_text)
        except:
            return {"call_outcome": "failed"}


llm_service = LLMService()
