from datetime import datetime

def parse_time(time_str: str) -> datetime:
    """Parses HH:MM string to a datetime object for today."""
    today = datetime.now().date()
    t = datetime.strptime(time_str, "%H:%M").time()
    return datetime.combine(today, t)

def format_time(dt: datetime) -> str:
    """Formats a datetime object to HH:MM string."""
    return dt.strftime("%H:%M")
