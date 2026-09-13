from datetime import timedelta
from buffer_algorithm.models import User, QueueSettings, AppointmentSlot, FeasibilityResult
from buffer_algorithm.utils import parse_time, format_time

def check_travel_feasibility(
    user: User,
    slot: AppointmentSlot,
    settings: QueueSettings,
    ignore_return_deadline: bool = False
) -> FeasibilityResult:
    """Checks if a user can feasibly take a given appointment slot."""
    slot_start = parse_time(slot.start_time)
    slot_end = parse_time(slot.end_time)
    
    departure_dt = slot_start - timedelta(minutes=user.outbound_travel_minutes)
    expected_return_dt = slot_end + timedelta(minutes=user.return_travel_minutes)
    
    # Check return home deadline
    if settings.return_home_feasibility_enabled and not ignore_return_deadline:
        deadline_dt = parse_time(settings.return_home_deadline)
        if expected_return_dt > deadline_dt:
            return FeasibilityResult(
                is_feasible=False,
                departure_time=format_time(departure_dt),
                arrival_time=slot.start_time,
                completion_time=slot.end_time,
                return_home_time=format_time(expected_return_dt),
                reason=f"Return home time ({format_time(expected_return_dt)}) exceeds deadline ({settings.return_home_deadline})"
            )
            
    return FeasibilityResult(
        is_feasible=True,
        departure_time=format_time(departure_dt),
        arrival_time=slot.start_time,
        completion_time=slot.end_time,
        return_home_time=format_time(expected_return_dt),
        reason=None
    )
