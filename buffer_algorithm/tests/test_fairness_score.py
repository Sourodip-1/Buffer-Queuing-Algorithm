import pytest
from buffer_algorithm.fairness_score import calculate_fairness_score

def test_fairness_score_valid():
    assert calculate_fairness_score(0.5, 0.5, 0.5, 0.5) == 0.5
    assert calculate_fairness_score(0.8, 0.2, 0.5, 0.5) == 0.5

def test_fairness_score_invalid_weights():
    with pytest.raises(ValueError):
        calculate_fairness_score(0.5, 0.5, 0.6, 0.5)

def test_fairness_score_invalid_scores():
    with pytest.raises(ValueError):
        calculate_fairness_score(1.5, 0.5, 0.5, 0.5)
