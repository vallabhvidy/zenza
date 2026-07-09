import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.models.input import Int, Float, Char, String, Array, Input, Repeat
from shared.tools import resolve


class TestResolve:
    def test_resolve_integer(self):
        assert resolve("5", {}) == 5

    def test_resolve_addition(self):
        assert resolve("2 + 3", {}) == 5

    def test_resolve_with_context(self):
        assert resolve("x + 3", {"x": 2}) == 5

    def test_resolve_multiplication(self):
        assert resolve("2 * 3", {}) == 6

    def test_resolve_invalid_expression(self):
        with pytest.raises(ValueError):
            resolve("x / 2", {})


class TestInt:
    def test_generate_within_range(self):
        int_field = Int(type="int", name="n", min="5", max="10")
        result = int_field.generate({})
        value = int(result)
        assert 5 <= value <= 10

    def test_generate_returns_context_value(self):
        int_field = Int(type="int", name="n", min="1", max="100")
        result = int_field.generate({"n": 42})
        assert result == "42"

    def test_generate_nocontext(self):
        int_field = Int(type="int", name="NOCONTEXT", min="1", max="10")
        context = {}
        result = int_field.generate(context)
        assert "NOCONTEXT" not in context
        assert result is not None


class TestFloat:
    def test_generate_within_range(self):
        float_field = Float(type="float", name="x", min="0", max="1")
        result = float_field.generate({})
        value = float(result)
        assert 0.0 <= value <= 1.0

    def test_generate_returns_context_value(self):
        float_field = Float(type="float", name="x", min="0", max="10")
        result = float_field.generate({"x": 5.5})
        assert result == "5.5"


class TestChar:
    def test_generate_default_chars(self):
        char_field = Char(type="char", name="c")
        result = char_field.generate({})
        assert len(result) == 1
        assert result in "abcdefghijklmnopqrstuvwxyz"

    def test_generate_custom_chars(self):
        char_field = Char(type="char", name="c", fromChars=["A", "B", "C"])
        result = char_field.generate({})
        assert result in ["A", "B", "C"]

    def test_generate_returns_context_value(self):
        char_field = Char(type="char", name="c", fromChars=["x", "y", "z"])
        result = char_field.generate({"c": "x"})
        assert result == "x"


class TestString:
    def test_generate_string(self):
        string_field = String(type="string", name="s", size="5")
        result = string_field.generate({})
        assert len(result) == 5
        assert result.isalpha()
        assert result.islower()

    def test_generate_with_context_size(self):
        string_field = String(type="string", name="s", size="n")
        result = string_field.generate({"n": 3})
        assert len(result) == 3


class TestArray:
    def test_generate_array(self):
        int_field = Int(type="int", name="NOCONTEXT", min="1", max="100")
        array_field = Array(
            type="array", name="arr", size="5", sorted=True, elementType=int_field
        )
        result = array_field.generate({})
        parts = result.split()
        assert len(parts) == 5
        for p in parts:
            assert 1 <= int(p) <= 100

    def test_generate_unsorted_array(self):
        int_field = Int(type="int", name="NOCONTEXT", min="1", max="100")
        array_field = Array(
            type="array", name="arr", size="3", sorted=False, elementType=int_field
        )
        result = array_field.generate({})
        parts = result.split()
        assert len(parts) == 3

    def test_generate_array_with_size_context(self):
        int_field = Int(type="int", name="NOCONTEXT", min="0", max="50")
        array_field = Array(
            type="array", name="arr", size="n", sorted=False, elementType=int_field
        )
        result = array_field.generate({"n": 4})
        parts = result.split()
        assert len(parts) == 4


class TestRepeat:
    def test_generate_repeat(self):
        int_field = Int(type="int", name="NOCONTEXT", min="1", max="10")
        repeat_input = Input(input=[int_field])
        repeat_field = Repeat(type="repeat", times="3", input=repeat_input)
        result = repeat_field.generate({})
        lines = result.split("\n")
        assert len(lines) == 3

    def test_generate_repeat_with_context_times(self):
        int_field = Int(type="int", name="NOCONTEXT", min="0", max="100")
        repeat_input = Input(input=[int_field])
        repeat_field = Repeat(type="repeat", times="n", input=repeat_input)
        result = repeat_field.generate({"n": 4})
        lines = result.split("\n")
        assert len(lines) == 4


class TestInput:
    def test_generate_simple_input(self):
        int_field = Int(type="int", name="n", min="10", max="10")
        input_schema = Input(input=[int_field])
        result = input_schema.generate({})
        assert result == "10"

    def test_generate_multiple_fields(self):
        n_field = Int(type="int", name="n", min="5", max="5")
        m_field = Int(type="int", name="m", min="10", max="10")
        input_schema = Input(input=[n_field, m_field])
        result = input_schema.generate({})
        assert result == "5\n10"

    def test_generate_with_nested_repeat(self):
        n_field = Int(type="int", name="n", min="3", max="3")
        repeat_input = Input(input=[n_field])
        repeat_field = Repeat(type="repeat", times="2", input=repeat_input)
        input_schema = Input(input=[repeat_field])
        result = input_schema.generate({})
        lines = result.split("\n")
        assert len(lines) == 2

    def test_generate_empty_input(self):
        input_schema = Input(input=[])
        result = input_schema.generate({})
        assert result == ""
