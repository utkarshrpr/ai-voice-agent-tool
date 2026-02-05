import json
from typing import Dict, Any, List
from anthropic import Anthropic
from app.config import settings
from app.models.call import TranscriptEntry
from app.models.structured_data import CheckInData, EmergencyData


class LLMService:
    """Service for LLM-based transcript processing and structured data extraction."""

    def __init__(self):
        if settings.anthropic_api_key:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            self.model = "claude-3-5-sonnet-20241022"  # Claude 3.5 Sonnet v2
        else:
            # Could add OpenAI support here
            raise ValueError("No LLM API key configured. Please set ANTHROPIC_API_KEY.")

    def _format_transcript(self, transcript: List[TranscriptEntry]) -> str:
        """Format transcript entries into readable text."""
        formatted = []
        for entry in transcript:
            role = "Agent" if entry.role == "agent" else "Driver"
            formatted.append(f"{role}: {entry.content}")
        return "\n".join(formatted)

    async def extract_check_in_data(
        self,
        transcript: List[TranscriptEntry],
        driver_name: str,
        load_number: str
    ) -> CheckInData:
        """Extract structured data from a check-in call transcript."""

        transcript_text = self._format_transcript(transcript)

        prompt = f"""You are analyzing a logistics dispatch call transcript. Extract structured data from the conversation.

CALL CONTEXT:
- Driver Name: {driver_name}
- Load Number: {load_number}
- Scenario: Driver check-in call

TRANSCRIPT:
{transcript_text}

Extract the following information and return ONLY a valid JSON object with these exact fields:

{{
  "call_outcome": "In-Transit Update" OR "Arrival Confirmation" OR "Incomplete",
  "driver_status": "Driving" OR "Delayed" OR "Arrived" OR "Unloading" OR null,
  "current_location": "string or null",
  "eta": "string or null",
  "delay_reason": "string or 'None'",
  "unloading_status": "string or 'N/A'",
  "pod_reminder_acknowledged": boolean
}}

EXTRACTION RULES:
- call_outcome: "Arrival Confirmation" if driver has arrived, "In-Transit Update" if still driving, "Incomplete" if unclear
- driver_status: Extract the driver's current status from their response
- current_location: Extract location mentioned (e.g., "I-10 near Indio, CA")
- eta: Extract estimated time of arrival if mentioned
- delay_reason: Extract reason for delay, or "None" if no delay
- unloading_status: Extract dock info, lumper status, or "N/A" if not arrived
- pod_reminder_acknowledged: true if driver acknowledges POD reminder, false otherwise

Return ONLY the JSON object, no other text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = response.content[0].text.strip()

        # Parse JSON response
        try:
            data = json.loads(result_text)
            return CheckInData(**data)
        except (json.JSONDecodeError, Exception) as e:
            # Return default incomplete data if parsing fails
            return CheckInData(call_outcome="Incomplete")

    async def extract_emergency_data(
        self,
        transcript: List[TranscriptEntry],
        driver_name: str,
        load_number: str
    ) -> EmergencyData:
        """Extract structured data from an emergency call transcript."""

        transcript_text = self._format_transcript(transcript)

        prompt = f"""You are analyzing an emergency logistics dispatch call transcript. Extract critical structured data.

CALL CONTEXT:
- Driver Name: {driver_name}
- Load Number: {load_number}
- Scenario: Emergency situation

TRANSCRIPT:
{transcript_text}

Extract the following information and return ONLY a valid JSON object with these exact fields:

{{
  "call_outcome": "Emergency Escalation" OR "Incomplete",
  "emergency_type": "Accident" OR "Breakdown" OR "Medical" OR "Other" OR null,
  "safety_status": "string or null",
  "injury_status": "string or null",
  "emergency_location": "string or null",
  "load_secure": boolean or null,
  "escalation_status": "Connected to Human Dispatcher"
}}

EXTRACTION RULES:
- emergency_type: Categorize the emergency based on keywords and context
- safety_status: Extract confirmation of safety (e.g., "Driver confirmed everyone is safe")
- injury_status: Extract injury information (e.g., "No injuries reported")
- emergency_location: Extract exact location of emergency
- load_secure: true if load is secure, false if not, null if unknown
- escalation_status: Should always be "Connected to Human Dispatcher"

Return ONLY the JSON object, no other text."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}]
        )

        result_text = response.content[0].text.strip()

        # Parse JSON response
        try:
            data = json.loads(result_text)
            return EmergencyData(**data)
        except (json.JSONDecodeError, Exception) as e:
            # Return default data if parsing fails
            return EmergencyData(call_outcome="Incomplete")

    async def extract_structured_data(
        self,
        transcript: List[TranscriptEntry],
        scenario_type: str,
        driver_name: str,
        load_number: str
    ) -> Dict[str, Any]:
        """
        Main method to extract structured data based on scenario type.
        Returns a dictionary representation of the structured data.
        """
        if scenario_type == "check_in":
            data = await self.extract_check_in_data(transcript, driver_name, load_number)
        elif scenario_type == "emergency":
            data = await self.extract_emergency_data(transcript, driver_name, load_number)
        else:
            raise ValueError(f"Unknown scenario type: {scenario_type}")

        return data.model_dump()

    def detect_emergency_keywords(self, text: str) -> bool:
        """Detect emergency keywords in text."""
        emergency_keywords = [
            "accident", "crash", "collision", "hit",
            "breakdown", "broken down", "broke down",
            "emergency", "urgent",
            "hurt", "injured", "injury", "pain",
            "medical", "hospital", "ambulance",
            "fire", "smoke",
            "help", "danger"
        ]

        text_lower = text.lower()
        return any(keyword in text_lower for keyword in emergency_keywords)
