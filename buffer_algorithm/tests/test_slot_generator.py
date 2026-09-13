from buffer_algorithm.models import QueueSettings
from buffer_algorithm.slot_generator import generate_slots

def test_generate_slots_with_break():
    settings = QueueSettings(
        opening_time="09:00",
        closing_time="10:00",
        service_duration_minutes=15,
        buffer_duration_minutes=60,
        break_enabled=True,
        break_start="09:30",
        break_end="09:45",
        return_home_feasibility_enabled=False,
        return_home_deadline="13:00"
    )
    slots = generate_slots(settings)
    assert len(slots) == 3
    assert slots[0].start_time == "09:00"
    assert slots[1].start_time == "09:15"
    assert slots[2].start_time == "09:45"
