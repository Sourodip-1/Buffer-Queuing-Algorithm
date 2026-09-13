from buffer_algorithm.config import CONVENIENCE_POLICY_RANGES

def calculate_convenience_factor(age: int) -> float:
    """Calculates convenience factor using interpolation based on age."""
    if age < 0:
        raise ValueError("Age cannot be negative.")
        
    for min_age, max_age, min_factor, max_factor in CONVENIENCE_POLICY_RANGES:
        if min_age <= age <= max_age:
            if max_age == min_age:
                return min_factor
            
            # Interpolation
            ratio = (age - min_age) / (max_age - min_age)
            return round(min_factor + ratio * (max_factor - min_factor), 4)
            
    # For ages above the max range
    last_range = CONVENIENCE_POLICY_RANGES[-1]
    if age > last_range[1]:
        return last_range[3]
        
    raise ValueError(f"Age {age} does not fall into any policy range.")
