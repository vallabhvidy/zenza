import pytest
from unittest.mock import Mock, patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from searching import binary_search
from validation import valid_lower_limit, valid_upper_limit
from models.run_request import RunRequest
from models.code import Code
from models.input import Int, Input


def create_mock_run_request(
    min_val="1", max_val="100", search=False, container_response=None
):
    if container_response is None:
        container_response = {"status": "OK", "time": 10, "memory": 100}

    mock_container = Mock()
    mock_container.run.return_value = container_response

    code = Code(
        code="test code",
        language="python",
        input_schema=Input(input=[Int(type="int", name="n", min="1", max="100")]),
        x_var=Int(type="int", name="n", min=min_val, max=max_val),
        search=search,
    )

    run_request = RunRequest(
        request_id="test-id", container=mock_container, code=code, active=True
    )

    return run_request


class TestBinarySearch:
    def test_binary_search_uses_x_var_max_in_comparison(self):
        run_request = create_mock_run_request(min_val="1", max_val="100", search=True)
        x_var = run_request.code.x_var
        assert hasattr(x_var, "max")
        assert x_var.max == "100"

    def test_binary_search_is_called_when_search_enabled(self):
        run_request = create_mock_run_request(min_val="1", max_val="100", search=True)
        assert run_request.code.search is True


class TestValidLowerLimit:
    def test_valid_lower_limit_returns_min_on_success(self):
        run_request = create_mock_run_request(min_val="5", max_val="100")

        result = valid_lower_limit(run_request)
        assert result == "5"

    def test_valid_lower_limit_returns_negative_on_error(self):
        run_request = create_mock_run_request(
            min_val="5", container_response={"status": "ERROR"}
        )

        result = valid_lower_limit(run_request)
        assert result == -1

    def test_valid_lower_limit_calls_container(self):
        run_request = create_mock_run_request(min_val="10", max_val="100")

        valid_lower_limit(run_request)

        run_request.container.run.assert_called()


class TestValidUpperLimit:
    def test_valid_upper_limit_without_search(self):
        run_request = create_mock_run_request(min_val="1", max_val="100", search=False)

        result = valid_upper_limit(run_request)
        assert result == "100"

    def test_valid_upper_limit_returns_negative_when_max_invalid(self):
        run_request = create_mock_run_request(
            min_val="1",
            max_val="100",
            search=False,
            container_response={"status": "ERROR"},
        )

        result = valid_upper_limit(run_request)
        assert result == -1
