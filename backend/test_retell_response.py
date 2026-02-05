"""
Test script to check what Retell AI returns for call details.
"""

import asyncio
import sys
from app.services.retell_service import RetellService
from app.services.supabase_service import SupabaseService


async def test_retell_response():
    """Check actual Retell API response format."""
    try:
        db = SupabaseService()
        retell = RetellService()

        # Get a recent call from database
        calls = await db.list_calls(limit=5)

        if not calls:
            print("No calls found in database")
            return

        for call in calls:
            if not call.retell_call_id:
                continue

            print(f"\n{'='*60}")
            print(f"Checking call: {call.id}")
            print(f"Retell Call ID: {call.retell_call_id}")
            print(f"Current DB Status: {call.status}")
            print(f"{'='*60}")

            try:
                # Fetch from Retell AI
                call_details = await retell.get_call_details(call.retell_call_id)

                print("\nRetell API Response:")
                print("-" * 60)

                # Print all top-level keys
                for key, value in call_details.items():
                    if isinstance(value, (dict, list)):
                        print(f"{key}: {type(value).__name__} (length: {len(value)})")
                    else:
                        print(f"{key}: {value}")

                print("\n" + "="*60)

                # Check specific status fields
                print("\nStatus-related fields:")
                print(f"  call_status: {call_details.get('call_status')}")
                print(f"  status: {call_details.get('status')}")
                print(f"  call_type: {call_details.get('call_type')}")
                print(f"  disconnection_reason: {call_details.get('disconnection_reason')}")

                # Check timestamps
                print("\nTimestamp fields:")
                print(f"  start_timestamp: {call_details.get('start_timestamp')}")
                print(f"  end_timestamp: {call_details.get('end_timestamp')}")
                print(f"  call_duration: {call_details.get('call_duration')}")

                # Check transcript
                transcript = call_details.get('transcript', [])
                print(f"\nTranscript: {len(transcript)} entries")

                break  # Just check first valid call

            except Exception as e:
                print(f"Error fetching call: {e}")
                continue

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_retell_response())
