from pydantic import BaseModel, Field
from typing import Optional, Literal


class CheckInData(BaseModel):
    """Structured data for check-in scenario."""
    call_outcome: Literal["In-Transit Update", "Arrival Confirmation", "Incomplete"] = "Incomplete"
    driver_status: Optional[Literal["Driving", "Delayed", "Arrived", "Unloading"]] = None
    current_location: Optional[str] = None
    eta: Optional[str] = None
    delay_reason: Optional[str] = "None"
    unloading_status: Optional[str] = "N/A"
    pod_reminder_acknowledged: bool = False


class EmergencyData(BaseModel):
    """Structured data for emergency scenario."""
    call_outcome: Literal["Emergency Escalation", "Incomplete"] = "Emergency Escalation"
    emergency_type: Optional[Literal["Accident", "Breakdown", "Medical", "Other"]] = None
    safety_status: Optional[str] = None
    injury_status: Optional[str] = None
    emergency_location: Optional[str] = None
    load_secure: Optional[bool] = None
    escalation_status: str = "Connected to Human Dispatcher"


class StructuredDataExtraction(BaseModel):
    """Container for extracted structured data with scenario type."""
    scenario_type: Literal["check_in", "emergency"]
    data: CheckInData | EmergencyData
    extraction_confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    notes: Optional[str] = None
