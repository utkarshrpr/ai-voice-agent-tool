from fastapi import APIRouter, HTTPException, Request, status
from typing import Dict, Any
from datetime import datetime
from app.models.call import CallStatus, CallUpdate, TranscriptEntry
from app.services.supabase_service import SupabaseService
from app.services.llm_service import LLMService

router = APIRouter()


@router.post("/retell")
async def retell_webhook(request: Request):
    """
    Webhook endpoint for Retell AI call events.
    Handles call lifecycle events and processes transcripts.
    """
    try:
        payload = await request.json()
        event_type = payload.get("event")

        db = SupabaseService()

        # Get call by Retell call ID
        retell_call_id = payload.get("call", {}).get("call_id")
        if not retell_call_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing call_id in webhook payload"
            )

        call = await db.get_call_by_retell_id(retell_call_id)
        if not call:
            # Call not found - this might be a call we didn't initiate
            print(f"Warning: Received webhook for unknown call: {retell_call_id}")
            return {"status": "ignored"}

        # Log event
        await db.create_call_event(
            call_id=call.id,
            event_type=event_type,
            event_data=payload
        )

        # Handle different event types
        if event_type == "call_started":
            await handle_call_started(db, call.id, payload)

        elif event_type == "call_ended":
            await handle_call_ended(db, call.id, payload)

        elif event_type == "call_analyzed":
            await handle_call_analyzed(db, call.id, payload)

        return {"status": "received"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process webhook: {str(e)}"
        )


async def handle_call_started(db: SupabaseService, call_id: str, payload: Dict[str, Any]):
    """Handle call_started event."""
    call_data = payload.get("call", {})

    update = CallUpdate(
        status=CallStatus.IN_PROGRESS,
        started_at=datetime.fromisoformat(call_data.get("start_timestamp").replace("Z", "+00:00")) if call_data.get("start_timestamp") else None
    )

    await db.update_call(call_id, update)


async def handle_call_ended(db: SupabaseService, call_id: str, payload: Dict[str, Any]):
    """Handle call_ended event."""
    call_data = payload.get("call", {})

    # Extract transcript
    transcript_data = call_data.get("transcript", [])
    transcript = []

    for entry in transcript_data:
        transcript.append(TranscriptEntry(
            role="agent" if entry.get("role") == "agent" else "user",
            content=entry.get("content", ""),
            timestamp=entry.get("timestamp")
        ))

    # Calculate duration
    duration = call_data.get("call_duration")

    update = CallUpdate(
        status=CallStatus.COMPLETED,
        transcript=transcript,
        call_duration=duration,
        ended_at=datetime.fromisoformat(call_data.get("end_timestamp").replace("Z", "+00:00")) if call_data.get("end_timestamp") else None
    )

    await db.update_call(call_id, update)

    # Trigger structured data extraction
    await extract_and_save_structured_data(db, call_id)


async def handle_call_analyzed(db: SupabaseService, call_id: str, payload: Dict[str, Any]):
    """Handle call_analyzed event (if available)."""
    # This event may contain additional analysis from Retell
    # We can use it for additional processing if needed
    pass


async def extract_and_save_structured_data(db: SupabaseService, call_id: str):
    """Extract structured data from call transcript using LLM."""
    try:
        # Get call with transcript
        call = await db.get_call(call_id)
        if not call or not call.transcript:
            print(f"Cannot extract structured data: No transcript for call {call_id}")
            return

        # Get agent config to determine scenario type
        agent = await db.get_agent_config(call.agent_config_id)
        if not agent:
            print(f"Cannot extract structured data: Agent config not found for call {call_id}")
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
        update = CallUpdate(structured_data=structured_data)
        await db.update_call(call_id, update)

        # Log extraction event
        await db.create_call_event(
            call_id=call_id,
            event_type="structured_data_extracted",
            event_data={"scenario_type": agent.scenario_type}
        )

    except Exception as e:
        print(f"Error extracting structured data for call {call_id}: {e}")
        # Don't fail the webhook - log and continue
        await db.create_call_event(
            call_id=call_id,
            event_type="structured_data_extraction_failed",
            event_data={"error": str(e)}
        )
