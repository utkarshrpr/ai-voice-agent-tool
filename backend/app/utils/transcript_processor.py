from typing import Dict, Any, List
from app.services.llm_service import llm_service


class TranscriptProcessor:

    async def process_transcript(
        self,
        transcript: List[Dict[str, str]],
        scenario_type: str
    ) -> Dict[str, Any]:
        """Process raw transcript and extract structured data."""

        # Use LLM to extract structured data
        structured_data = await llm_service.extract_structured_data(
            transcript,
            scenario_type
        )

        # Validate and clean data
        if scenario_type == "check_in":
            structured_data = self._validate_check_in_data(structured_data)
        else:
            structured_data = self._validate_emergency_data(structured_data)

        return structured_data

    def _validate_check_in_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and set defaults for check-in data."""
        return {
            "call_outcome": data.get("call_outcome", "failed"),
            "driver_status": data.get("driver_status", "in_transit"),
            "current_location": data.get("current_location"),
            "eta": data.get("eta"),
            "delay_reason": data.get("delay_reason"),
            "unloading_status": data.get("unloading_status"),
            "pod_reminder_acknowledged": data.get("pod_reminder_acknowledged", False)
        }

    def _validate_emergency_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and set defaults for emergency data."""
        return {
            "call_outcome": data.get("call_outcome", "failed"),
            "emergency_type": data.get("emergency_type", "other"),
            "safety_status": data.get("safety_status", "unknown"),
            "injury_status": data.get("injury_status"),
            "emergency_location": data.get("emergency_location"),
            "load_secure": data.get("load_secure"),
            "escalation_status": "escalated"
        }

    def extract_key_moments(self, transcript: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """Extract key moments from transcript for quick review."""
        key_moments = []

        for i, message in enumerate(transcript):
            content_lower = message.get("content", "").lower()

            # Detect emergency keywords
            emergency_keywords = ["emergency", "accident", "breakdown", "injured", "help", "blowout"]
            if any(keyword in content_lower for keyword in emergency_keywords):
                key_moments.append({
                    "type": "emergency_mention",
                    "timestamp_index": i,
                    "content": message.get("content")
                })

            # Detect location mentions
            location_keywords = ["at", "near", "mile marker", "exit", "location"]
            if any(keyword in content_lower for keyword in location_keywords):
                key_moments.append({
                    "type": "location_mention",
                    "timestamp_index": i,
                    "content": message.get("content")
                })

        return key_moments


transcript_processor = TranscriptProcessor()
