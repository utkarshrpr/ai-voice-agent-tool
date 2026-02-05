from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.call import Call, CallCreate, WebCallResponse, CallStatus
from app.services.supabase_service import SupabaseService
from app.services.retell_service import RetellService

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
        from app.models.call import CallUpdate
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
