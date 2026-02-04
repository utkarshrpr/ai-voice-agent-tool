from pydantic import BaseModel
from typing import Optional
from enum import Enum


class CallOutcome(str, Enum):
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"


class DriverStatus(str, Enum):
    IN_TRANSIT = "in_transit"
    ARRIVED = "arrived"
    UNLOADING = "unloading"
    COMPLETED = "completed"


class EmergencyType(str, Enum):
    ACCIDENT = "accident"
    BREAKDOWN = "breakdown"
    MEDICAL = "medical"
    TIRE_BLOWOUT = "tire_blowout"
    OTHER = "other"


class SafetyStatus(str, Enum):
    SAFE = "safe"
    UNSAFE = "unsafe"
    UNKNOWN = "unknown"


class CheckInData(BaseModel):
    call_outcome: CallOutcome
    driver_status: DriverStatus
    current_location: Optional[str] = None
    eta: Optional[str] = None
    delay_reason: Optional[str] = None
    unloading_status: Optional[str] = None
    pod_reminder_acknowledged: bool = False


class EmergencyData(BaseModel):
    call_outcome: CallOutcome
    emergency_type: EmergencyType
    safety_status: SafetyStatus
    injury_status: Optional[str] = None
    emergency_location: Optional[str] = None
    load_secure: Optional[bool] = None
    escalation_status: str = "escalated"
