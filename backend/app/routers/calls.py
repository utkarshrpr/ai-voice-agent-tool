from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.call import Call, CallCreate, WebCallResponse, CallStatus, CallUpdate, TranscriptEntry
from app.services.supabase_service import SupabaseService
from app.services.retell_service import RetellService
from app.services.llm_service import LLMService

router = APIRouter()


@router.post("/web-call", response_model=WebCallResponse, status_code=status.HTTP_201_CREATED)
async def create_web_call(call_data: CallCreate):
    """
    Create a web call and return access token for browser-based calling.
    This is the critical endpoint for initiating web calls (not phone calls).
    """
    try:
        db = SupabaseService()
        retell = RetellService()

        # Get agent configuration
        agent = await db.get_agent_config(call_data.agent_config_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent configuration not found"
            )

        if not agent.retell_agent_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent has not been created in Retell AI yet"
            )

        # Create call record in database
        call = await db.create_call(call_data)

        # Create web call in Retell AI
        metadata = {
            "driver_name": call_data.driver_name,
            "load_number": call_data.load_number,
            "phone_number": call_data.phone_number or "N/A",
            "call_db_id": call.id
        }

        web_call_data = await retell.create_web_call(
            agent_id=agent.retell_agent_id,
            metadata=metadata
        )

        # Update call with Retell call ID
        await db.update_call(
            call.id,
            CallUpdate(
                retell_call_id=web_call_data["call_id"],
                status=CallStatus.PENDING
            )
        )

        # Log call event
        await db.create_call_event(
            call_id=call.id,
            event_type="web_call_created",
            event_data={"retell_call_id": web_call_data["call_id"]}
        )

        return WebCallResponse(
            call_id=call.id,
            access_token=web_call_data["access_token"],
            agent_id=agent.retell_agent_id,
            sample_rate=web_call_data["sample_rate"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create web call: {str(e)}"
        )


@router.post("/{call_id}/fetch-transcript", status_code=status.HTTP_200_OK)
async def fetch_call_transcript(call_id: str):
    """
    Fetch transcript from Retell AI for a completed call.
    Smart caching: Only fetches if transcript is not already present.
    """
    try:
        db = SupabaseService()
        retell = RetellService()

        # Get call from database
        call = await db.get_call(call_id)
        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        if not call.retell_call_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Call does not have a Retell call ID"
            )

        # Check if transcript already exists
        if call.transcript and len(call.transcript) > 0:
            return {
                "status": "already_exists",
                "message": "Transcript already exists in database",
                "transcript_entries": len(call.transcript),
                "call_duration": call.call_duration
            }

        # Check if call has ended (only fetch for ended calls)
        if call.status not in [CallStatus.COMPLETED, CallStatus.FAILED]:
            return {
                "status": "call_not_ended",
                "message": "Call has not ended yet. Transcript not available.",
                "current_status": call.status
            }

        # Fetch call details from Retell AI
        call_details = await retell.get_call_details(call.retell_call_id)

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
        from datetime import datetime

        # Update call with transcript
        update = CallUpdate(
            status=CallStatus.COMPLETED,
            transcript=transcript,
            call_duration=call_duration,
            ended_at=datetime.now()
        )

        await db.update_call(call_id, update)

        # Extract structured data if we have an agent config
        agent = await db.get_agent_config(call.agent_config_id)
        if agent and transcript:
            try:
                llm = LLMService()
                structured_data = await llm.extract_structured_data(
                    transcript=transcript,
                    scenario_type=agent.scenario_type,
                    driver_name=call.driver_name,
                    load_number=call.load_number
                )

                # Save structured data
                await db.update_call(call_id, CallUpdate(structured_data=structured_data))

                # Log event
                await db.create_call_event(
                    call_id=call_id,
                    event_type="structured_data_extracted",
                    event_data={"scenario_type": agent.scenario_type}
                )
            except Exception as e:
                print(f"Failed to extract structured data: {e}")

        # Log event
        await db.create_call_event(
            call_id=call_id,
            event_type="transcript_fetched",
            event_data={"transcript_length": len(transcript)}
        )

        return {
            "status": "success",
            "message": "Transcript fetched and saved",
            "transcript_entries": len(transcript),
            "call_duration": call_duration
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch transcript: {str(e)}"
        )


@router.get("/{call_id}/transcript-status", status_code=status.HTTP_200_OK)
async def check_transcript_status(call_id: str):
    """
    Check if transcript is available and whether it needs to be fetched.
    Returns helpful status for UI decisions.
    """
    try:
        db = SupabaseService()
        call = await db.get_call(call_id)

        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        # Determine transcript status
        has_transcript = call.transcript and len(call.transcript) > 0
        call_ended = call.status in [CallStatus.COMPLETED, CallStatus.FAILED]
        needs_fetch = call_ended and not has_transcript

        return {
            "call_id": call_id,
            "has_transcript": has_transcript,
            "call_ended": call_ended,
            "needs_fetch": needs_fetch,
            "status": call.status,
            "transcript_entries": len(call.transcript) if call.transcript else 0,
            "structured_data_available": call.structured_data is not None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check transcript status: {str(e)}"
        )


@router.get("/", response_model=List[Call])
async def list_calls(
    agent_config_id: Optional[str] = None,
    limit: int = 50
):
    """List all calls with optional filtering."""
    try:
        db = SupabaseService()
        calls = await db.list_calls(agent_config_id=agent_config_id, limit=limit)
        return calls
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list calls: {str(e)}"
        )


@router.get("/{call_id}", response_model=Call)
async def get_call(call_id: str):
    """Get a specific call."""
    try:
        db = SupabaseService()
        call = await db.get_call(call_id)

        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        return call
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get call: {str(e)}"
        )


@router.post("/{call_id}/mark-ended", status_code=status.HTTP_200_OK)
async def mark_call_ended(call_id: str):
    """
    Mark a call as ended. Called by frontend when Retell SDK fires call_ended event.
    This is the webhook alternative - frontend tells backend when call ends.
    """
    try:
        db = SupabaseService()

        # Get call from database
        call = await db.get_call(call_id)
        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        # Only update if not already ended
        if call.status not in [CallStatus.COMPLETED, CallStatus.FAILED]:
            from datetime import datetime

            update = CallUpdate(
                status=CallStatus.COMPLETED,
                ended_at=datetime.now()
            )

            await db.update_call(call_id, update)

            # Log event
            await db.create_call_event(
                call_id=call_id,
                event_type="call_ended_by_client",
                event_data={"source": "frontend_sdk"}
            )

        return {
            "status": "success",
            "message": "Call marked as ended",
            "call_id": call_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark call as ended: {str(e)}"
        )


@router.delete("/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_call(call_id: str):
    """Delete a call."""
    try:
        db = SupabaseService()

        # Check if call exists
        call = await db.get_call(call_id)
        if not call:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call not found"
            )

        # Delete call
        success = await db.delete_call(call_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete call"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete call: {str(e)}"
        )
