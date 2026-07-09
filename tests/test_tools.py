import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.tools import exprange, ao5


class TestExprange:
    def test_default_factor_2(self):
        result = list(exprange(1, 10))
        assert result == [1, 2, 4, 8]

    def test_explicit_factor_2(self):
        result = list(exprange(1, 10, factor=2))
        assert result == [1, 2, 4, 8]

    def test_factor_1_5(self):
        result = list(exprange(1, 10, factor=1.5))
        expected = [1, 2, 3, 4, 6, 9]
        assert result == expected

    def test_factor_1(self):
        result = list(exprange(1, 10, factor=1))
        assert result == [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    def test_start_equals_end(self):
        result = list(exprange(5, 5))
        assert result == [5]

    def test_start_greater_than_end(self):
        result = list(exprange(10, 5))
        assert result == []

    def test_large_factor(self):
        result = list(exprange(1, 100, factor=3))
        assert result == [1, 3, 9, 27, 81]

    def test_minimum_increment(self):
        result = list(exprange(5, 7, factor=1.1))
        assert result == [5, 6, 7]


class TestAo5:
    def test_small_n_returns_direct(self):
        run = lambda n: {"status": "OK", "time": n, "memory": n * 10}
        result = ao5(run, 1)
        assert result["time"] == 1
        assert result["memory"] == 10
        assert result["status"] == "OK"

    def test_ao5_with_ok_status(self):
        runs = 0

        def run(n):
            nonlocal runs
            runs += 1
            return {"status": "OK", "time": n * 100, "memory": n * 50}

        result = ao5(run, 10)
        assert runs == 8
        assert result["status"] == "OK"
        assert 900 <= result["time"] <= 1100

    def test_ao5_returns_error_status(self):
        def run(n):
            if n == 9:
                return {"status": "ERROR", "message": "fail"}
            return {"status": "OK", "time": n * 100, "memory": n * 50}

        result = ao5(run, 10)
        assert result["status"] == "ERROR"

    def test_ao5_calculates_correct_n(self):
        def run(n):
            return {"status": "OK", "time": n * 10, "memory": n}

        result = ao5(run, 10)
        assert result["n"] == 10

    def test_ao5_n_2_returns_direct(self):
        run = lambda n: {"status": "OK", "time": 5, "memory": 5}
        result = ao5(run, 2)
        assert result["time"] == 5
        assert result["status"] == "OK"

    def test_ao5_boundary_n_minus_2(self):
        run = lambda n: {"status": "OK", "time": n, "memory": n}
        result = ao5(run, 3)
        assert result["status"] == "OK"
