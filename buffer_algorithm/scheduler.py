from typing import List, Dict, Any
from datetime import timedelta
from buffer_algorithm.models import User, QueueSettings
from buffer_algorithm.slot_generator import generate_slots
from buffer_algorithm.travel_feasibility import check_travel_feasibility
from buffer_algorithm.age_factor import calculate_age_factor
from buffer_algorithm.convenience_factor import calculate_convenience_factor
from buffer_algorithm.fairness_score import calculate_fairness_score
from buffer_algorithm.config import INITIAL_WEIGHTS
from buffer_algorithm.utils import parse_time

def classify_registration_group(user: User, settings: QueueSettings) -> str:
    """Classifies user as BUFFER or FCFS based on registration time."""
    open_time = parse_time(settings.opening_time)
    buffer_end = open_time + timedelta(minutes=settings.buffer_duration_minutes)
    reg_time = parse_time(user.registered_at)
    
    if reg_time <= buffer_end:
        return "BUFFER"
    return "FCFS"

def schedule_users(users: List[User], settings: QueueSettings) -> Dict[str, Any]:
    slots = generate_slots(settings)
    available_slots = [{'slot': s, 'assigned': False} for s in slots]
    
    buffer_users = []
    fcfs_users = []
    scheduled_result = []
    unscheduled_users = []
    
    closing_dt = parse_time(settings.closing_time)
    last_entry_dt = closing_dt - timedelta(hours=2)
    
    for user in users:
        reg_dt = parse_time(user.registered_at)
        if reg_dt > last_entry_dt:
            user.feasibility_status = "UNSCHEDULED"
            user.feasibility_reason = "Registered less than 2 hours before closing."
            user.fairness_score = 0.0
            unscheduled_users.append({
                "user_id": user.id,
                "fairness_score": user.fairness_score,
                "status": "UNSCHEDULED",
                "reason": user.feasibility_reason
            })
            continue

        user.age_factor = calculate_age_factor(user.age)
        user.convenience_factor = calculate_convenience_factor(user.age)
        user.fairness_score = calculate_fairness_score(
            user.age_factor, 
            user.convenience_factor,
            INITIAL_WEIGHTS["age_weight"],
            INITIAL_WEIGHTS["convenience_weight"]
        )
        
        group = classify_registration_group(user, settings)
        if group == "BUFFER":
            buffer_users.append(user)
        else:
            fcfs_users.append(user)
            
    # Tie-breaking: 1. fairness (desc), 2. registration time (asc), 3. user ID (asc)
    buffer_users.sort(key=lambda u: (-u.fairness_score, parse_time(u.registered_at), u.id))
    
    # FCFS: 1. registration time (asc), 2. user ID (asc)
    fcfs_users.sort(key=lambda u: (parse_time(u.registered_at), u.id))
    
    # Lists already initialized and populated with early rejections
    # 4. Assign slots for BUFFER users (WITH swapping logic)
    for user in buffer_users:
        assigned = False
        for slot_info in available_slots:
            if slot_info['assigned']:
                continue
                
            slot = slot_info['slot']
            feasibility = check_travel_feasibility(user, slot, settings)
            
            if feasibility.is_feasible:
                slot_info['assigned'] = True
                slot_info['user'] = user
                
                user.assigned_appointment_start = slot.start_time
                user.assigned_appointment_end = slot.end_time
                user.departure_time = feasibility.departure_time
                user.expected_return_home = feasibility.return_home_time
                user.feasibility_status = "SCHEDULED"
                user.feasibility_reason = None
                assigned = True
                break
                
        if not assigned:
            # Swapping Logic for Buffer users
            swapped = False
            unassigned_slots = [si for si in available_slots if not si['assigned']]
            
            for unassigned_slot_info in unassigned_slots:
                if swapped: break
                late_slot = unassigned_slot_info['slot']
                
                for assigned_slot_info in available_slots:
                    if not assigned_slot_info['assigned']:
                        continue
                        
                    early_slot = assigned_slot_info['slot']
                    other_user = assigned_slot_info['user']
                    
                    # Can current user take the early slot?
                    feas_current_early = check_travel_feasibility(user, early_slot, settings)
                    if not feas_current_early.is_feasible:
                        continue
                        
                    # Can other user take the late slot?
                    feas_other_late = check_travel_feasibility(other_user, late_slot, settings)
                    if not feas_other_late.is_feasible:
                        continue
                        
                    # Swap them
                    unassigned_slot_info['assigned'] = True
                    unassigned_slot_info['user'] = other_user
                    other_user.assigned_appointment_start = late_slot.start_time
                    other_user.assigned_appointment_end = late_slot.end_time
                    other_user.departure_time = feas_other_late.departure_time
                    other_user.expected_return_home = feas_other_late.return_home_time
                    other_user.feasibility_reason = "Swapped to later slot to accommodate a farther user"
                    
                    assigned_slot_info['user'] = user
                    user.assigned_appointment_start = early_slot.start_time
                    user.assigned_appointment_end = early_slot.end_time
                    user.departure_time = feas_current_early.departure_time
                    user.expected_return_home = feas_current_early.return_home_time
                    user.feasibility_status = "SCHEDULED"
                    user.feasibility_reason = "Swapped with a closer user"
                    
                    swapped = True
                    assigned = True
                    break
            
            if not assigned:
                reason = "No slots available." if all(s['assigned'] for s in available_slots) else "No feasible appointment before return-home deadline"
                user.feasibility_status = "UNSCHEDULED"
                user.feasibility_reason = reason
                unscheduled_users.append({
                    "user_id": user.id,
                    "fairness_score": user.fairness_score,
                    "status": "UNSCHEDULED",
                    "reason": reason
                })

    # 5. Assign slots for FCFS users (NO swapping logic)
    for user in fcfs_users:
        assigned = False
        for slot_info in available_slots:
            if slot_info['assigned']:
                continue
                
            slot = slot_info['slot']
            feasibility = check_travel_feasibility(user, slot, settings, ignore_return_deadline=True)
            
            if feasibility.is_feasible:
                slot_info['assigned'] = True
                slot_info['user'] = user
                
                user.assigned_appointment_start = slot.start_time
                user.assigned_appointment_end = slot.end_time
                user.departure_time = feasibility.departure_time
                user.expected_return_home = feasibility.return_home_time
                user.feasibility_status = "SCHEDULED"
                user.feasibility_reason = None
                assigned = True
                break
                
        if not assigned:
            reason = "No slots available." if all(s['assigned'] for s in available_slots) else "No slots available before queue closing time (FCFS)"
            user.feasibility_status = "UNSCHEDULED"
            user.feasibility_reason = reason
            unscheduled_users.append({
                "user_id": user.id,
                "fairness_score": user.fairness_score,
                "status": "UNSCHEDULED",
                "reason": reason
            })

    # Collect scheduled results in chronological order
    for slot_info in available_slots:
        if slot_info['assigned']:
            u = slot_info['user']
            scheduled_result.append({
                "user_id": u.id,
                "appointment_start": u.assigned_appointment_start,
                "appointment_end": u.assigned_appointment_end,
                "departure_time": u.departure_time,
                "expected_return_home": u.expected_return_home,
                "fairness_score": u.fairness_score,
                "group": classify_registration_group(u, settings),
                "feasible": True,
                "status": "SCHEDULED",
                "reason": u.feasibility_reason
            })
            
    return {
        "queue_id": "demo_queue",
        "schedule": scheduled_result,
        "unscheduled_users": unscheduled_users
    }
