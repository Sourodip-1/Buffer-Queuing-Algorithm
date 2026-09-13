from buffer_algorithm.models import User, QueueSettings
from buffer_algorithm.scheduler import schedule_users

def test_four_user_demo():
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
    scheduled = result["schedule"]
    
    assert len(scheduled) == 4
    assert scheduled[0]["user_id"] == "U3" # Highest fairness
    assert scheduled[1]["user_id"] == "U4"
    assert scheduled[2]["user_id"] == "U1"
    assert scheduled[3]["user_id"] == "U2"

def test_fcfs_fallback():
    settings = QueueSettings(
        opening_time="09:00",
        closing_time="17:00",
        service_duration_minutes=10,
        buffer_duration_minutes=60,
        break_enabled=False,
        break_start="",
        break_end="",
        return_home_feasibility_enabled=False,
        return_home_deadline="",
    )
    users = [
        # BUFFER user
        User(id="U1", name="User 1", age=25, registered_at="09:30", outbound_travel_minutes=5, return_travel_minutes=5),
        # FCFS user
        User(id="U2", name="User 2", age=90, registered_at="10:30", outbound_travel_minutes=5, return_travel_minutes=5),
    ]
    # U2 has higher fairness due to age 90, but U2 is FCFS.
    result = schedule_users(users, settings)
    assert result["schedule"][0]["user_id"] == "U1"
    assert result["schedule"][1]["user_id"] == "U2"

def test_unfeasible_slot():
    settings = QueueSettings(
        opening_time="09:00",
        closing_time="17:00",
        service_duration_minutes=10,
        buffer_duration_minutes=60,
        break_enabled=False,
        break_start="",
        break_end="",
        return_home_feasibility_enabled=True,
        return_home_deadline="10:00",
    )
    users = [
        User(id="U1", name="User 1", age=26, registered_at="09:00", outbound_travel_minutes=120, return_travel_minutes=120),
    ]
    result = schedule_users(users, settings)
    assert len(result["schedule"]) == 0
    assert len(result["unscheduled_users"]) == 1
    assert result["unscheduled_users"][0]["user_id"] == "U1"
    assert "return-home deadline" in result["unscheduled_users"][0]["reason"]

def test_swapping_logic():
    settings = QueueSettings(
        opening_time="09:00",
        closing_time="09:20",
        service_duration_minutes=10,
        buffer_duration_minutes=60,
        break_enabled=False,
        break_start="",
        break_end="",
        return_home_feasibility_enabled=True,
        return_home_deadline="11:00",
    )
    users = [
        # High fairness, local
        User(id="Local", name="Local", age=42, registered_at="07:00", outbound_travel_minutes=5, return_travel_minutes=5),
        # Low fairness, far (must get 09:00, cannot take 09:10)
        User(id="Far", name="Far", age=20, registered_at="07:00", outbound_travel_minutes=105, return_travel_minutes=105)
    ]
    result = schedule_users(users, settings)
    scheduled = result["schedule"]
    
    assert len(scheduled) == 2
    assert scheduled[0]["user_id"] == "Far"
    assert scheduled[1]["user_id"] == "Local"
    assert "Swapped" in scheduled[0].get("reason", "")
    assert "Swapped" in scheduled[1].get("reason", "")
