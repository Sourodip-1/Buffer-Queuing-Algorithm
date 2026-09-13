from buffer_algorithm.config import AGE_POLICY_RANGES

def calculate_age_factor(age: int) -> float:
    """Calculates age factor using interpolation."""
    if age < 0:
        raise ValueError("Age cannot be negative.")
        
    for min_age, max_age, min_factor, max_factor in AGE_POLICY_RANGES:
        if min_age <= age <= max_age:
            if max_age == min_age:
                return min_factor
            
            # Interpolation
            ratio = (age - min_age) / (max_age - min_age)
            return round(min_factor + ratio * (max_factor - min_factor), 4)
            
    # If age is above the maximum range, return the max factor of the last range.
    last_range = AGE_POLICY_RANGES[-1]
    if age > last_range[1]:
        return last_range[3]
        
    raise ValueError(f"Age {age} does not fall into any policy range.")
