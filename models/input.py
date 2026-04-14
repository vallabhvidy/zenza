from typing import Union, Literal, List, Optional, Annotated, Dict, Any
from pydantic import BaseModel, Field
import random
import string
from tools import resolve

class Int(BaseModel):
    type: Literal['int']
    name: str
    min: str
    max: str

    def generate(self, context) -> str:
        if self.name in context:
            return str(context[self.name])
        value = random.randint(resolve(self.min, context), resolve(self.max, context))

        if self.name != 'NOCONTEXT':
            context[self.name] = value
        return str(value)


class Char(BaseModel):
    type: Literal['char']
    name: str
    fromChars: List[str] = list(string.ascii_lowercase)

    def generate(self, context):
        if self.name in context:
            return str(context[self.name])
        value = random.choice(self.fromChars)
        if self.name != 'NOCONTEXT':
            context[self.name] = value
        return str(value)


class Float(BaseModel):
    type: Literal['float']
    name: str
    min: str
    max: str

    def generate(self, context) -> str:
        if self.name in context:
            return str(context[self.name])
        value = random.uniform(resolve(self.min, context), resolve(self.max, context))

        if self.name != 'NOCONTEXT':
            context[self.name] = value
        return str(value)


BaseTypes = Union[Int, Char, Float]


class String(BaseModel):
    type: Literal['string']
    name: str
    size: str
    fromChars: List[str] = list(string.ascii_lowercase)

    def generate(self, context):
        return ''.join(random.choices(self.fromChars, k=resolve(self.size, context)))


class Array(BaseModel):
    type: Literal['array']
    name: str
    size: str
    sorted: bool
    elementType: BaseTypes

    def generate(self, context):
        size = resolve(self.size, context)
        arr = [self.elementType.generate(context) for _ in range(size)]

        if self.sorted:
            arr = sorted(arr)

        return ' '.join(arr)


class Repeat(BaseModel):
    type: Literal['repeat']
    times: str
    input: 'Input' = Field(...)

    def generate(self, context: dict) -> str:
        times = resolve(self.times, context)
        lines = [self.input.generate(context) for _ in range(times)]

        return '\n'.join(lines)


Node = Annotated[Union[Int, Array, Repeat], Field(..., discriminator='type')]


class Input(BaseModel):
    input: List[Node]

    def generate(self, context: Optional[dict] = None) -> str:
        if context is None:
            context = {}

        output_lines = []
        for node in self.input:
            output_lines.append(node.generate(context))

        return '\n'.join(output_lines)


Input.model_rebuild()
Repeat.model_rebuild()
