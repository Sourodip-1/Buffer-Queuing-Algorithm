import sys
import os

# Ensure the parent directory is in the Python path so 'buffer_algorithm' module can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import json
from buffer_algorithm.models import QueueSettings, User
from buffer_algorithm.scheduler import schedule_users

def run_demo():
    settings = QueueSettings(
        opening_time="09:00",
        closing_time="17:00",
        service_duration_minutes=10,
        buffer_duration_minutes=60,
        break_enabled=True,
        break_start="13:00",
        break_end="14:00",
        return_home_feasibility_enabled=True,
        return_home_deadline="13:00",
    )
    
    users = [
        User(id="U1", name="User 1", age=26, registered_at="09:00", outbound_travel_minutes=58, return_travel_minutes=58),
        User(id="U2", name="User 2", age=25, registered_at="09:00", outbound_travel_minutes=5, return_travel_minutes=5),
        User(id="U3", name="User 3", age=46, registered_at="09:00", outbound_travel_minutes=20, return_travel_minutes=20),
        User(id="U4", name="User 4", age=30, registered_at="09:00", outbound_travel_minutes=30, return_travel_minutes=30),
    ]
    
    result = schedule_users(users, settings)
    
    print("--- JSON Summary ---")
    print(json.dumps(result, indent=2))
    
    print("\n--- Detailed Console Output ---")
    for user in users:
        print(f"\nUser ID: {user.id}")
        print(f"Age: {user.age}")
        print(f"Age factor: {user.age_factor}")
        print(f"Convenience factor: {user.convenience_factor}")
        print(f"Fairness score: {user.fairness_score}")
        print(f"Travel time (outbound): {user.outbound_travel_minutes} min")
        print(f"Assigned slot: {user.assigned_appointment_start} - {user.assigned_appointment_end}")
        print(f"Departure time: {user.departure_time}")
        print(f"Return-home time: {user.expected_return_home}")
        print(f"Feasibility status: {user.feasibility_status}")
        if user.feasibility_reason:
            print(f"Reason: {user.feasibility_reason}")

if __name__ == "__main__":
    run_demo()
