from fastapi import APIRouter, Request, HTTPException
from app.services.supabase_service import supabase_service
from app.utils.conversation_manager import conversation_manager
from app.utils.transcript_processor import transcript_processor
from app.models.call import CallStatus
from datetime import datetime
import logging

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


@router.post("/retell")
async def retell_webhook(request: Request):
    """Handle webhooks from Retell AI."""

    try:
        payload = await request.json()
        event_type = payload.get("event")
        call_id = payload.get("call", {}).get("metadata", {}).get("call_id")

        if not call_id:
            logger.warning("Received webhook without call_id")
            return {"status": "ignored"}

        # Log event
        await supabase_service.create_call_event({
            "call_id": call_id,
            "event_type": event_type,
            "event_data": payload,
            "timestamp": datetime.utcnow().isoformat()
        })

        if event_type == "call_started":
            await supabase_service.update_call(call_id, {
                "call_status": CallStatus.IN_PROGRESS.value,
                "started_at": datetime.utcnow().isoformat()
            })

        elif event_type == "call_ended":
            # Get conversation history
            history = conversation_manager.end_conversation(call_id)

            # Get call and agent config
            call_data = await supabase_service.get_call(call_id)
            if not call_data:
                return {"status": "error", "message": "Call not found"}

            agent_config = await supabase_service.get_agent_config(
                call_data.get("agent_config_id")
            )

            # Extract structured data from transcript
            transcript = payload.get("call", {}).get("transcript", [])
            if not transcript and history:
                transcript = history

            structured_data = await transcript_processor.process_transcript(
                transcript,
                agent_config.get("scenario_type", "check_in")
            )

            # Update call record
            duration = payload.get("call", {}).get("duration_ms", 0) // 1000
            await supabase_service.update_call(call_id, {
                "call_status": CallStatus.COMPLETED.value,
                "ended_at": datetime.utcnow().isoformat(),
                "duration_seconds": duration,
                "raw_transcript": transcript,
                "structured_data": structured_data
            })

        elif event_type == "call_analyzed":
            # Update with final analysis from Retell
            transcript = payload.get("call", {}).get("transcript", [])
            call_data = await supabase_service.get_call(call_id)

            if call_data:
                agent_config = await supabase_service.get_agent_config(
                    call_data.get("agent_config_id")
                )

                structured_data = await transcript_processor.process_transcript(
                    transcript,
                    agent_config.get("scenario_type", "check_in")
                )

                await supabase_service.update_call(call_id, {
                    "raw_transcript": transcript,
                    "structured_data": structured_data
                })

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
