"""
Background service to poll Retell AI for call status updates.
This eliminates the need for webhooks and provides reliable status tracking.
"""

import asyncio
import logging
from datetime import datetime
from typing import List

from app.models.call import Call, CallStatus, CallUpdate, TranscriptEntry
from app.services.retell_service import RetellService
from app.services.supabase_service import SupabaseService
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class CallPollerService:
    """
    Polls Retell AI API to check status of in-progress calls.
    Updates database when calls end and triggers transcript extraction.
    """

    def __init__(self, poll_interval: int = 5):
        """
        Initialize the call poller.

        Args:
            poll_interval: Seconds between poll cycles (default: 5)
        """
        self.poll_interval = poll_interval
        self.running = False
        self.task = None

    async def start(self):
        """Start the background polling task."""
        if self.running:
            logger.warning("Call poller already running")
            return

        self.running = True
        self.task = asyncio.create_task(self._poll_loop())
        logger.info(f"Call poller started (interval: {self.poll_interval}s)")

    async def stop(self):
        """Stop the background polling task."""
        if not self.running:
            return

        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Call poller stopped")

    async def _poll_loop(self):
        """Main polling loop."""
        while self.running:
            try:
                await self._poll_calls()
            except Exception as e:
                logger.error(f"Error in poll cycle: {e}", exc_info=True)

            # Wait before next poll
            await asyncio.sleep(self.poll_interval)

    async def _poll_calls(self):
        """Poll Retell AI for status of in-progress calls."""
        try:
            db = SupabaseService()

            # Get all calls that are not in terminal states
            in_progress_calls = await self._get_in_progress_calls(db)

            if not in_progress_calls:
                return

            logger.debug(f"Polling {len(in_progress_calls)} in-progress calls")

            # Check each call
            for call in in_progress_calls:
                try:
                    await self._check_call_status(db, call)
                except Exception as e:
                    logger.error(f"Error checking call {call.id}: {e}")

        except Exception as e:
            logger.error(f"Error polling calls: {e}", exc_info=True)

    async def _get_in_progress_calls(self, db: SupabaseService) -> List[Call]:
        """Get calls that need status checking."""
        try:
            # Get all calls that are pending or in progress
            all_calls = await db.list_calls(limit=100)

            # Filter to non-terminal states
            in_progress = [
                call for call in all_calls
                if call.status in [CallStatus.PENDING, CallStatus.IN_PROGRESS]
                and call.retell_call_id  # Must have Retell call ID
            ]

            return in_progress
        except Exception as e:
            logger.error(f"Error getting in-progress calls: {e}")
            return []

    async def _check_call_status(self, db: SupabaseService, call: Call):
        """Check a single call's status with Retell AI."""
        try:
            retell = RetellService()

            # Fetch call details from Retell AI
            logger.info(f"Checking Retell API for call {call.id} (retell_call_id: {call.retell_call_id})")

            try:
                call_details = await retell.get_call_details(call.retell_call_id)

                # LOG THE ENTIRE RESPONSE to understand what Retell returns
                logger.info(f"Retell API response for call {call.id}:")
                logger.info(f"  Available keys: {list(call_details.keys())}")
                for key, value in call_details.items():
                    if isinstance(value, (dict, list)) and len(str(value)) > 100:
                        logger.info(f"  {key}: {type(value).__name__} (length: {len(value)})")
                    else:
                        logger.info(f"  {key}: {value}")

            except Exception as e:
                # If call not found in Retell (404), skip it for now
                if "404" in str(e):
                    from datetime import datetime, timedelta, timezone
                    now_utc = datetime.now(timezone.utc)
                    created_at_utc = call.created_at if call.created_at.tzinfo else call.created_at.replace(tzinfo=timezone.utc)
                    call_age = now_utc - created_at_utc

                    # Skip very recent calls (< 30 seconds)
                    if call_age < timedelta(seconds=30):
                        logger.debug(f"Call {call.id} not found (404), very recent ({call_age.total_seconds():.1f}s), skipping")
                        return

                    # Mark as failed if old (> 5 minutes)
                    if call_age > timedelta(minutes=5):
                        logger.warning(f"Call {call.id} not found (404), old ({call_age.total_seconds():.1f}s), marking failed")
                        await db.update_call(call.id, CallUpdate(status=CallStatus.FAILED, ended_at=datetime.now()))
                        await db.create_call_event(call_id=call.id, event_type="call_not_found_in_retell", event_data={"error": str(e)})
                    else:
                        logger.debug(f"Call {call.id} not found (404), age {call_age.total_seconds():.1f}s, will retry")
                    return
                raise

            # Get call status from Retell (try multiple field names)
            retell_status = (call_details.get("call_status") or call_details.get("status", "")).lower()

            logger.info(f"Call {call.id}: Extracted status = '{retell_status}'")

            # Map Retell status to our status
            if retell_status in ["registered", "pending"]:
                new_status = CallStatus.PENDING
            elif retell_status in ["ongoing", "in_progress", "active"]:
                new_status = CallStatus.IN_PROGRESS
                # Update started_at if not set
                if not call.started_at:
                    start_time = call_details.get("start_timestamp")
                    if start_time:
                        await db.update_call(
                            call.id,
                            CallUpdate(
                                status=CallStatus.IN_PROGRESS,
                                started_at=datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                            )
                        )
            elif retell_status in ["ended", "completed", "done"]:
                new_status = CallStatus.COMPLETED
                # Call ended - process it
                logger.info(f"Call {call.id} detected as ended, processing...")
                await self._handle_call_ended(db, call, call_details)
                return
            elif retell_status in ["error", "failed"]:
                new_status = CallStatus.FAILED
                await db.update_call(
                    call.id,
                    CallUpdate(status=CallStatus.FAILED, ended_at=datetime.now())
                )
                logger.warning(f"Call {call.id} failed on Retell: {call_details.get('disconnect_reason')}")
                return
            else:
                logger.warning(f"Unknown Retell status for call {call.id}: '{retell_status}' - Full response keys: {list(call_details.keys())}")
                return

            # Update status if changed
            if new_status != call.status:
                logger.info(f"Call {call.id} status changed: {call.status} -> {new_status}")
                await db.update_call(call.id, CallUpdate(status=new_status))

        except Exception as e:
            logger.error(f"Error checking call status for {call.id}: {e}")

    async def _handle_call_ended(self, db: SupabaseService, call: Call, call_details: dict):
        """Handle a call that has ended."""
        try:
            logger.info(f"Processing ended call: {call.id}")

            # Extract transcript
            transcript_data = call_details.get("transcript", [])
            transcript = []

            for entry in transcript_data:
                transcript.append(TranscriptEntry(
                    role="agent" if entry.get("role") == "agent" else "user",
                    content=entry.get("content", ""),
                    timestamp=entry.get("timestamp")
                ))

            # Get call duration and timestamps
            call_duration = call_details.get("call_duration")
            end_time = call_details.get("end_timestamp")

            # Update call with transcript and completion
            update = CallUpdate(
                status=CallStatus.COMPLETED,
                transcript=transcript,
                call_duration=call_duration,
                ended_at=datetime.fromisoformat(end_time.replace("Z", "+00:00")) if end_time else datetime.now()
            )

            await db.update_call(call.id, update)

            # Log event
            await db.create_call_event(
                call_id=call.id,
                event_type="call_ended_by_polling",
                event_data={
                    "retell_status": call_details.get("call_status"),
                    "transcript_length": len(transcript)
                }
            )

            # Extract structured data if we have transcript and agent config
            if transcript:
                await self._extract_structured_data(db, call)

            logger.info(f"Call {call.id} processing complete")

        except Exception as e:
            logger.error(f"Error handling ended call {call.id}: {e}", exc_info=True)

    async def _extract_structured_data(self, db: SupabaseService, call: Call):
        """Extract structured data from call transcript using LLM."""
        try:
            # Get agent config to determine scenario type
            agent = await db.get_agent_config(call.agent_config_id)
            if not agent:
                logger.warning(f"Cannot extract structured data: Agent config not found for call {call.id}")
                return

            # Use LLM to extract structured data
            llm = LLMService()
            structured_data = await llm.extract_structured_data(
                transcript=call.transcript,
                scenario_type=agent.scenario_type,
                driver_name=call.driver_name,
                load_number=call.load_number
            )

            # Update call with structured data
            await db.update_call(call.id, CallUpdate(structured_data=structured_data))

            # Log extraction event
            await db.create_call_event(
                call_id=call.id,
                event_type="structured_data_extracted",
                event_data={"scenario_type": agent.scenario_type}
            )

            logger.info(f"Structured data extracted for call {call.id}")

        except Exception as e:
            logger.error(f"Error extracting structured data for call {call.id}: {e}")
            # Don't fail the entire process - log and continue
            await db.create_call_event(
                call_id=call.id,
                event_type="structured_data_extraction_failed",
                event_data={"error": str(e)}
            )
