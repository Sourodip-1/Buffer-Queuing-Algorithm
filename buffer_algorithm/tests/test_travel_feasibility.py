from buffer_algorithm.models import User, QueueSettings, AppointmentSlot
from buffer_algorithm.travel_feasibility import check_travel_feasibility

def test_check_travel_feasibility_pass():
    user = User(id="1", name="Test", age=25, registered_at="09:00", outbound_travel_minutes=30, return_travel_minutes=30)
    slot = AppointmentSlot(start_time="10:00", end_time="10:10")
    settings = QueueSettings(
        opening_time="09:00", closing_time="17:00", service_duration_minutes=10, buffer_duration_minutes=60,
        break_enabled=False, break_start="13:00", break_end="14:00",
        return_home_feasibility_enabled=True, return_home_deadline="13:00"
    )
    result = check_travel_feasibility(user, slot, settings)
    assert result.is_feasible
    assert result.departure_time == "09:30"
    assert result.return_home_time == "10:40"

def test_check_travel_feasibility_fail():
    user = User(id="1", name="Test", age=25, registered_at="09:00", outbound_travel_minutes=60, return_travel_minutes=60)
    slot = AppointmentSlot(start_time="12:00", end_time="12:10")
    settings = QueueSettings(
        opening_time="09:00", closing_time="17:00", service_duration_minutes=10, buffer_duration_minutes=60,
        break_enabled=False, break_start="13:00", break_end="14:00",
        return_home_feasibility_enabled=True, return_home_deadline="13:00"
    )
    result = check_travel_feasibility(user, slot, settings)
    assert not result.is_feasible
