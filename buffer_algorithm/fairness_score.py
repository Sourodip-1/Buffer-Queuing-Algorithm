def calculate_fairness_score(
    age_score: float,
    convenience_score: float,
    age_weight: float,
    convenience_weight: float,
) -> float:
    """Calculates the weighted fairness score."""
    if not (0 <= age_score <= 1):
        raise ValueError("Age score must be between 0 and 1.")
    if not (0 <= convenience_score <= 1):
        raise ValueError("Convenience score must be between 0 and 1.")
    if age_weight < 0 or convenience_weight < 0:
        raise ValueError("Weights cannot be negative.")
    
    if abs((age_weight + convenience_weight) - 1.0) > 1e-6:
        raise ValueError("Weights must sum up to 1.")
        
    return round(age_weight * age_score + convenience_weight * convenience_score, 4)
