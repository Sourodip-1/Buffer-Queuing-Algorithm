from dataclasses import dataclass
from typing import Optional

@dataclass
class QueueSettings:
    opening_time: str
    closing_time: str
    service_duration_minutes: int
    buffer_duration_minutes: int
    break_enabled: bool
    break_start: str
    break_end: str
    return_home_feasibility_enabled: bool
    return_home_deadline: str

@dataclass
class User:
    id: str
    name: str
    age: int
    registered_at: str
    outbound_travel_minutes: int
    return_travel_minutes: int
    age_factor: Optional[float] = None
    convenience_factor: Optional[float] = None
    fairness_score: Optional[float] = None
    assigned_appointment_start: Optional[str] = None
    assigned_appointment_end: Optional[str] = None
    departure_time: Optional[str] = None
    expected_return_home: Optional[str] = None
    feasibility_status: Optional[str] = None
    feasibility_reason: Optional[str] = None

@dataclass
class AppointmentSlot:
    start_time: str
    end_time: str

@dataclass
class FeasibilityResult:
    is_feasible: bool
    departure_time: Optional[str]
    arrival_time: Optional[str]
    completion_time: Optional[str]
    return_home_time: Optional[str]
    reason: Optional[str]
