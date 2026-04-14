import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.code import Code
from models.input import Int, Input


class TestCode:
    def test_valid_code_python(self):
        code = Code(
            code='print("hello")',
            language="python",
            input_schema=Input(input=[Int(type="int", name="n", min="1", max="10")]),
            x_var=Int(type="int", name="n", min="1", max="10"),
            reduce_noise=False,
            search=False,
        )
        assert code.language == "python"
        assert code.code == 'print("hello")'
        assert code.reduce_noise is False
        assert code.search is False

    def test_valid_code_cpp(self):
        code = Code(
            code="#include <iostream>",
            language="cpp",
            input_schema=Input(input=[Int(type="int", name="n", min="1", max="10")]),
            x_var=Int(type="int", name="n", min="1", max="10"),
            reduce_noise=True,
            search=True,
        )
        assert code.language == "cpp"
        assert code.reduce_noise is True
        assert code.search is True

    def test_code_default_reduce_noise(self):
        code = Code(
            code='print("test")',
            language="python",
            input_schema=Input(input=[Int(type="int", name="n", min="1", max="10")]),
            x_var=Int(type="int", name="n", min="1", max="10"),
        )
        assert code.reduce_noise is False

    def test_code_default_search(self):
        code = Code(
            code='print("test")',
            language="python",
            input_schema=Input(input=[Int(type="int", name="n", min="1", max="10")]),
            x_var=Int(type="int", name="n", min="1", max="10"),
        )
        assert code.search is False

    def test_invalid_language(self):
        with pytest.raises(ValueError):
            Code(
                code="some code",
                language="java",
                input_schema=Input(
                    input=[Int(type="int", name="n", min="1", max="10")]
                ),
                x_var=Int(type="int", name="n", min="1", max="10"),
            )

    def test_code_max_length(self):
        long_code = "x" * 500_000
        code = Code(
            code=long_code,
            language="python",
            input_schema=Input(input=[Int(type="int", name="n", min="1", max="10")]),
            x_var=Int(type="int", name="n", min="1", max="10"),
        )
        assert len(code.code) == 500_000
