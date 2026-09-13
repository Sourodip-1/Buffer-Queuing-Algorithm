import pytest
from buffer_algorithm.age_factor import calculate_age_factor

def test_age_factor_valid_ranges():
    assert calculate_age_factor(16) == 0.6
    assert calculate_age_factor(20) == 0.2286
    assert calculate_age_factor(25) == 0.4
    assert calculate_age_factor(42) == 0.6
    assert calculate_age_factor(85) == 0.8

def test_age_factor_invalid():
    with pytest.raises(ValueError):
        calculate_age_factor(-5)
