from typing import List, Dict, Any
from app.models.call import TranscriptEntry


class TranscriptProcessor:
    """Utility class for processing and formatting call transcripts."""

    @staticmethod
    def format_for_display(transcript: List[TranscriptEntry]) -> str:
        """
        Format transcript for human-readable display.
        Returns a formatted string with speaker labels and timestamps.
        """
        if not transcript:
            return "No transcript available."

        lines = []
        for i, entry in enumerate(transcript):
            speaker = "Agent" if entry.role == "agent" else "Driver"
            timestamp = f"[{entry.timestamp:.1f}s]" if entry.timestamp else ""
            lines.append(f"{timestamp} {speaker}: {entry.content}")

        return "\n".join(lines)

    @staticmethod
    def extract_keywords(transcript: List[TranscriptEntry], keywords: List[str]) -> List[Dict[str, Any]]:
        """
        Extract occurrences of specific keywords from transcript.
        Returns list of matches with context.
        """
        matches = []

        for entry in transcript:
            content_lower = entry.content.lower()

            for keyword in keywords:
                if keyword.lower() in content_lower:
                    matches.append({
                        "keyword": keyword,
                        "speaker": entry.role,
                        "content": entry.content,
                        "timestamp": entry.timestamp
                    })

        return matches

    @staticmethod
    def get_conversation_summary(transcript: List[TranscriptEntry]) -> Dict[str, Any]:
        """
        Generate basic statistics about the conversation.
        """
        if not transcript:
            return {
                "total_turns": 0,
                "agent_turns": 0,
                "driver_turns": 0,
                "total_words": 0
            }

        agent_turns = sum(1 for entry in transcript if entry.role == "agent")
        driver_turns = sum(1 for entry in transcript if entry.role == "user")
        total_words = sum(len(entry.content.split()) for entry in transcript)

        return {
            "total_turns": len(transcript),
            "agent_turns": agent_turns,
            "driver_turns": driver_turns,
            "total_words": total_words,
            "avg_words_per_turn": total_words / len(transcript) if transcript else 0
        }

    @staticmethod
    def search_transcript(transcript: List[TranscriptEntry], query: str) -> List[TranscriptEntry]:
        """
        Search transcript for entries containing the query string.
        Case-insensitive search.
        """
        query_lower = query.lower()
        return [
            entry for entry in transcript
            if query_lower in entry.content.lower()
        ]

    @staticmethod
    def get_driver_responses(transcript: List[TranscriptEntry]) -> List[str]:
        """Extract all driver responses from transcript."""
        return [
            entry.content for entry in transcript
            if entry.role == "user"
        ]

    @staticmethod
    def get_agent_responses(transcript: List[TranscriptEntry]) -> List[str]:
        """Extract all agent responses from transcript."""
        return [
            entry.content for entry in transcript
            if entry.role == "agent"
        ]
