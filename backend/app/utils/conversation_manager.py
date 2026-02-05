from typing import List, Dict, Any, Optional
from app.models.call import TranscriptEntry


class ConversationManager:
    """
    Utility class for managing conversation flow and context.
    Useful for analyzing conversation patterns and detecting special cases.
    """

    # Emergency keywords that should trigger immediate protocol change
    EMERGENCY_KEYWORDS = [
        "accident", "crash", "collision", "hit",
        "breakdown", "broken down", "broke down",
        "emergency", "urgent",
        "hurt", "injured", "injury", "pain",
        "medical", "hospital", "ambulance",
        "fire", "smoke", "burning",
        "help", "danger", "stuck"
    ]

    # Keywords indicating uncooperative driver
    UNCOOPERATIVE_INDICATORS = [
        "don't know", "dunno", "whatever",
        "leave me alone", "stop calling",
        "busy", "not now"
    ]

    # Keywords indicating noisy environment
    NOISE_INDICATORS = [
        "can't hear", "what", "say again",
        "repeat that", "speak up", "louder",
        "breaking up", "bad signal"
    ]

    @staticmethod
    def detect_emergency(transcript: List[TranscriptEntry]) -> Optional[Dict[str, Any]]:
        """
        Detect if an emergency is mentioned in the conversation.
        Returns details about the emergency if detected.
        """
        for entry in transcript:
            if entry.role == "user":  # Driver's messages
                content_lower = entry.content.lower()

                for keyword in ConversationManager.EMERGENCY_KEYWORDS:
                    if keyword in content_lower:
                        return {
                            "detected": True,
                            "keyword": keyword,
                            "message": entry.content,
                            "timestamp": entry.timestamp
                        }

        return None

    @staticmethod
    def detect_uncooperative_pattern(transcript: List[TranscriptEntry]) -> bool:
        """
        Detect if the driver is being uncooperative.
        Looks for short responses, dismissive language, or explicit refusal.
        """
        driver_responses = [
            entry for entry in transcript
            if entry.role == "user"
        ]

        if len(driver_responses) < 3:
            return False

        # Check for very short responses (< 5 words)
        short_responses = sum(
            1 for entry in driver_responses
            if len(entry.content.split()) < 5
        )

        # Check for uncooperative keywords
        uncooperative_count = sum(
            1 for entry in driver_responses
            for indicator in ConversationManager.UNCOOPERATIVE_INDICATORS
            if indicator in entry.content.lower()
        )

        # If more than 50% of responses are short or multiple uncooperative indicators
        return (short_responses / len(driver_responses) > 0.5) or (uncooperative_count >= 2)

    @staticmethod
    def detect_noisy_environment(transcript: List[TranscriptEntry]) -> bool:
        """
        Detect if the conversation is affected by a noisy environment.
        Looks for communication difficulty indicators.
        """
        noise_mentions = 0

        for entry in transcript:
            content_lower = entry.content.lower()
            for indicator in ConversationManager.NOISE_INDICATORS:
                if indicator in content_lower:
                    noise_mentions += 1

        # If noise indicators appear 2 or more times
        return noise_mentions >= 2

    @staticmethod
    def analyze_response_quality(transcript: List[TranscriptEntry]) -> Dict[str, Any]:
        """
        Analyze the quality of driver responses.
        Returns metrics about response completeness and engagement.
        """
        driver_responses = [
            entry for entry in transcript
            if entry.role == "user"
        ]

        if not driver_responses:
            return {
                "avg_response_length": 0,
                "one_word_responses": 0,
                "engaged": False
            }

        word_counts = [len(entry.content.split()) for entry in driver_responses]
        one_word = sum(1 for count in word_counts if count == 1)
        avg_length = sum(word_counts) / len(word_counts)

        return {
            "total_responses": len(driver_responses),
            "avg_response_length": avg_length,
            "one_word_responses": one_word,
            "engaged": avg_length > 5 and one_word / len(driver_responses) < 0.3
        }

    @staticmethod
    def get_conversation_context(
        driver_name: str,
        load_number: str,
        phone_number: Optional[str] = None
    ) -> str:
        """
        Generate context string for the agent to use in conversation.
        """
        context = f"Driver: {driver_name}, Load: {load_number}"
        if phone_number:
            context += f", Phone: {phone_number}"
        return context

    @staticmethod
    def should_end_call(transcript: List[TranscriptEntry], max_attempts: int = 3) -> bool:
        """
        Determine if the call should be ended due to unresponsiveness.
        """
        if len(transcript) < max_attempts * 2:  # Need at least attempts * 2 turns
            return False

        # Check last few driver responses
        recent_driver_responses = [
            entry for entry in transcript[-max_attempts * 2:]
            if entry.role == "user"
        ]

        if len(recent_driver_responses) < max_attempts:
            return False

        # If all recent responses are very short or dismissive
        short_count = sum(
            1 for entry in recent_driver_responses
            if len(entry.content.split()) < 3
        )

        return short_count >= max_attempts

    @staticmethod
    def extract_location_mentions(transcript: List[TranscriptEntry]) -> List[str]:
        """
        Extract potential location mentions from the transcript.
        Uses simple heuristics (Interstate, Highway, Mile Marker, city names).
        """
        locations = []

        for entry in transcript:
            if entry.role == "user":
                content = entry.content

                # Look for interstate mentions (I-10, I-15, etc.)
                import re
                interstate_matches = re.findall(r'I-\d+', content, re.IGNORECASE)
                locations.extend(interstate_matches)

                # Look for highway mentions
                highway_matches = re.findall(r'Highway \d+', content, re.IGNORECASE)
                locations.extend(highway_matches)

                # Look for mile marker mentions
                mile_matches = re.findall(r'Mile Marker \d+', content, re.IGNORECASE)
                locations.extend(mile_matches)

        return locations
