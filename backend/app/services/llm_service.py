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
            self.model = "claude-3-haiku-20240307"  # Claude 3 Haiku - only model available for this API key
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
  "driver_status": "Driving" OR "Delayed" OR "Arrived" OR "Unloading" OR N/A,
  "current_location": "string or N/A",
  "eta": "string or N/A",
  "delay_reason": "string or 'None'",
  "unloading_status": "string or 'N/A'",
  "pod_reminder_acknowledged": boolean
}}

EXTRACTION RULES:
- call_outcome: "Arrival Confirmation" if driver has arrived, "In-Transit Update" if still driving, "Incomplete" if unclear or call ended prematurely
- driver_status: Extract the driver's current status from their response. Use N/A if no clear status provided.
- current_location: Extract location mentioned (e.g., "I-10 near Indio, CA"). Use N/A if not provided or unclear.
- eta: Extract estimated time of arrival if mentioned. Use N/A if not provided.
- delay_reason: Extract reason for delay, or "None" if no delay mentioned. Use "Unknown" if delay mentioned but no reason given.
- unloading_status: Extract dock info, lumper status, or "N/A" if not arrived. Use N/A if arrived but no status given.
- pod_reminder_acknowledged: true if driver acknowledges POD reminder, false otherwise

EDGE CASES TO HANDLE:
- Empty transcript or call disconnected immediately: Set call_outcome to "Incomplete" and all other fields to N/A/"None"/"N/A"
- Driver gives one-word answers or minimal responses: Extract what's available, use N/A for missing data
- Conflicting information: Use the most recent information provided
- Driver refuses to answer: Use N/A for that specific field
- Noisy/unclear audio: If driver repeats information, use the clearest version
- Call ended before completing: Mark as "Incomplete" but extract any data that was provided

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
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            print(f"LLM response was: {result_text}")
            # Return default incomplete data if parsing fails
            return CheckInData(
                call_outcome="Incomplete",
                driver_status=None,
                current_location=None,
                eta=None,
                delay_reason="Unknown - parsing error",
                unloading_status="N/A",
                pod_reminder_acknowledged=False
            )
        except Exception as e:
            print(f"Failed to validate check-in data: {e}")
            # Return default incomplete data if validation fails
            return CheckInData(
                call_outcome="Incomplete",
                driver_status=None,
                current_location=None,
                eta=None,
                delay_reason="Unknown - validation error",
                unloading_status="N/A",
                pod_reminder_acknowledged=False
            )

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
  "emergency_type": "Accident" OR "Breakdown" OR "Medical" OR "Other" OR N/A,
  "safety_status": "string or N/A",
  "injury_status": "string or N/A",
  "emergency_location": "string or N/A",
  "load_secure": boolean or N/A,
  "escalation_status": "Connected to Human Dispatcher"
}}

EXTRACTION RULES:
- call_outcome: "Emergency Escalation" if emergency confirmed, "Incomplete" if call disconnected or unclear
- emergency_type: Categorize based on keywords. Use N/A if type not clearly stated.
  - "Accident": collision, crash, hit
  - "Breakdown": vehicle/truck issues, mechanical failure
  - "Medical": injury, illness, health emergency
  - "Other": fire, theft, or other emergencies
- safety_status: Extract confirmation of safety (e.g., "Driver confirmed everyone is safe"). Use N/A if not discussed.
- injury_status: Extract injury information (e.g., "No injuries reported", "Driver has minor cuts"). Use N/A if not discussed.
- emergency_location: Extract exact location of emergency. Use N/A if not provided or unclear.
- load_secure: true if load is secure, false if damaged/unsecured, N/A if not discussed
- escalation_status: Should always be "Connected to Human Dispatcher"

EDGE CASES TO HANDLE:
- Call disconnected before full details gathered: Set call_outcome to "Incomplete", extract available data, use N/A for missing critical fields
- Driver is panicked or incoherent: Extract what you can understand, use N/A for unclear information
- False alarm (no actual emergency): Set emergency_type to N/A, safety_status to "No emergency confirmed"
- Driver mentions multiple issues: Prioritize the most serious emergency_type (Medical > Accident > Breakdown > Other)
- Unclear safety status: Use N/A rather than assuming
- Location partially provided: Extract what's available (e.g., "Highway 95, exact mile marker unknown")

CRITICAL: In emergencies, it's better to mark fields as N/A than to make assumptions. Accuracy is paramount.

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
        except json.JSONDecodeError as e:
            print(f"Failed to parse emergency LLM response as JSON: {e}")
            print(f"LLM response was: {result_text}")
            # Return default incomplete data if parsing fails
            return EmergencyData(
                call_outcome="Incomplete",
                emergency_type=None,
                safety_status=None,
                injury_status=None,
                emergency_location=None,
                load_secure=None,
                escalation_status="Parsing Error - Manual Review Required"
            )
        except Exception as e:
            print(f"Failed to validate emergency data: {e}")
            # Return default data if validation fails
            return EmergencyData(
                call_outcome="Incomplete",
                emergency_type=None,
                safety_status=None,
                injury_status=None,
                emergency_location=None,
                load_secure=None,
                escalation_status="Validation Error - Manual Review Required"
            )

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

        Automatically detects emergencies even in check_in calls.
        """
        # Handle empty or very short transcripts
        if not transcript or len(transcript) == 0:
            print("Warning: Empty transcript provided for structured data extraction")
            if scenario_type == "emergency":
                return EmergencyData(
                    call_outcome="Incomplete",
                    emergency_type=None,
                    safety_status="No data - call disconnected",
                    injury_status=None,
                    emergency_location=None,
                    load_secure=None,
                    escalation_status="Manual Review Required"
                ).model_dump()
            else:
                return CheckInData(
                    call_outcome="Incomplete",
                    driver_status=None,
                    current_location=None,
                    eta=None,
                    delay_reason="No data - call disconnected",
                    unloading_status="N/A",
                    pod_reminder_acknowledged=False
                ).model_dump()

        # Check if emergency keywords are present in the transcript
        transcript_text = self._format_transcript(transcript)
        is_emergency_detected = self.detect_emergency_keywords(transcript_text)

        # Override scenario type if emergency detected
        if is_emergency_detected:
            print(f"Emergency detected in transcript! Switching to emergency extraction.")
            scenario_type = "emergency"

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
