from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.models.call import Call, CallCreate, CallStatus
from app.services.supabase_service import supabase_service
from app.services.retell_service import retell_service
from app.utils.conversation_manager import conversation_manager
from app.utils.transcript_processor import transcript_processor
from typing import List
from datetime import datetime
import json

router = APIRouter(prefix="/api/calls", tags=["calls"])


@router.post("", response_model=Call)
async def create_call(call_data: CallCreate):
    """Initiate a new phone call."""

    # Get agent configuration
    agent_config = await supabase_service.get_agent_config(call_data.agent_config_id)
    if not agent_config:
        raise HTTPException(status_code=404, detail="Agent config not found")

    # Create call record
    call_record = {
        "agent_config_id": call_data.agent_config_id,
        "driver_name": call_data.driver_name,
        "driver_phone": call_data.driver_phone,
        "load_number": call_data.load_number,
        "call_status": CallStatus.INITIATED.value,
        "created_at": datetime.utcnow().isoformat()
    }

    db_call = await supabase_service.create_call(call_record)
    if not db_call:
        raise HTTPException(status_code=500, detail="Failed to create call record")

    # Initialize conversation
    call_context = {
        "driver_name": call_data.driver_name,
        "load_number": call_data.load_number,
        "scenario_type": agent_config.get("scenario_type")
    }
    conversation_manager.initialize_conversation(
        db_call["id"],
        agent_config,
        call_context
    )

    try:
        # Initiate call through Retell AI
        retell_response = await retell_service.create_phone_call(
            agent_config,
            call_data.driver_phone,
            {
                "call_id": db_call["id"],
                "driver_name": call_data.driver_name,
                "load_number": call_data.load_number
            }
        )

        # Update call with Retell ID
        await supabase_service.update_call(db_call["id"], {
            "retell_call_id": retell_response.get("call_id"),
            "call_status": CallStatus.IN_PROGRESS.value,
            "started_at": datetime.utcnow().isoformat()
        })

        db_call["retell_call_id"] = retell_response.get("call_id")
        db_call["call_status"] = CallStatus.IN_PROGRESS.value

    except Exception as e:
        # Update call as failed
        await supabase_service.update_call(db_call["id"], {
            "call_status": CallStatus.FAILED.value
        })
        raise HTTPException(status_code=500, detail=f"Failed to initiate call: {str(e)}")

    return db_call


@router.get("", response_model=List[Call])
async def list_calls(limit: int = 50, offset: int = 0):
    """List all calls with pagination."""
    return await supabase_service.list_calls(limit, offset)


@router.get("/{call_id}", response_model=Call)
async def get_call(call_id: str):
    """Get details of a specific call."""
    call = await supabase_service.get_call(call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.websocket("/ws/{call_id}")
async def websocket_endpoint(websocket: WebSocket, call_id: str):
    """WebSocket endpoint for real-time call updates."""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "user_message":
                # Process user message and get agent response
                user_content = message.get("content", "")
                response = await conversation_manager.process_user_message(
                    call_id,
                    user_content
                )

                await websocket.send_json({
                    "type": "agent_response",
                    "content": response
                })

            elif message.get("type") == "call_ended":
                # Process final transcript
                history = conversation_manager.end_conversation(call_id)

                # Get agent config to determine scenario type
                call_data = await supabase_service.get_call(call_id)
                agent_config = await supabase_service.get_agent_config(
                    call_data.get("agent_config_id")
                )

                # Extract structured data
                structured_data = await transcript_processor.process_transcript(
                    history,
                    agent_config.get("scenario_type")
                )

                # Update call record
                await supabase_service.update_call(call_id, {
                    "call_status": CallStatus.COMPLETED.value,
                    "ended_at": datetime.utcnow().isoformat(),
                    "duration_seconds": message.get("duration_seconds"),
                    "raw_transcript": history,
                    "structured_data": structured_data
                })

                await websocket.send_json({
                    "type": "call_completed",
                    "structured_data": structured_data
                })
                break

    except WebSocketDisconnect:
        conversation_manager.end_conversation(call_id)
