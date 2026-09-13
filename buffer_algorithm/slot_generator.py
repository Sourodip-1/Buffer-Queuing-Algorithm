from typing import List
from datetime import timedelta
from buffer_algorithm.models import QueueSettings, AppointmentSlot
from buffer_algorithm.utils import parse_time, format_time

def generate_slots(settings: QueueSettings) -> List[AppointmentSlot]:
    """Generates appointment slots based on queue settings."""
    slots = []
    
    start_time = parse_time(settings.opening_time)
    end_time = parse_time(settings.closing_time)
    
    if start_time >= end_time:
        raise ValueError("Queue closing time must be after opening time.")
        
    break_start = None
    break_end = None
    if settings.break_enabled:
        break_start = parse_time(settings.break_start)
        break_end = parse_time(settings.break_end)
        if break_start >= break_end:
            raise ValueError("Break end time must be after break start time.")
            
    current_time = start_time
    delta = timedelta(minutes=settings.service_duration_minutes)
    
    while current_time + delta <= end_time:
        slot_start = current_time
        slot_end = current_time + delta
        
        # Check break overlap
        if settings.break_enabled and break_start and break_end:
            if (slot_start < break_end and slot_end > break_start):
                current_time = break_end
                continue
                
        slots.append(AppointmentSlot(
            start_time=format_time(slot_start),
            end_time=format_time(slot_end)
        ))
        current_time = slot_end
        
    return slots
