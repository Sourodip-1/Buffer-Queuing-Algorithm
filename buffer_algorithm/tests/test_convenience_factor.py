import pytest
from buffer_algorithm.convenience_factor import calculate_convenience_factor

def test_convenience_factor_valid():
    assert calculate_convenience_factor(16) == 0.6
    assert calculate_convenience_factor(85) == 0.8

def test_convenience_factor_invalid():
    with pytest.raises(ValueError):
        calculate_convenience_factor(-1)
