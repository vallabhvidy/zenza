from typing import Union, Literal, List, Optional, Annotated
from pydantic import BaseModel, Field
import random
import string

def resolve(size: str, context: dict) -> int:
    size = size.strip()
    if size.isdigit():
        return int(size)
    
    else:
        return context[size]
    

class Int(BaseModel):
    type: Literal['int']
    name: str
    min: int = Field(default=0)
    max: int = Field(default=10**9)

    def generate(self, context) -> str:
        if self.name in context:
            return str(context[self.name])
        value = random.randint(self.min, self.max)
        
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
    min: int = Field(default=0)
    max: int = Field(default=10**9)

    def generate(self, context) -> str:
        if self.name in context:
            return str(context[self.name])
        value = random.uniform(self.min, self.max)
        
        if self.name != 'NOCONTEXT':
            context[self.name] = value
        return str(value)

class Array(BaseModel):
    type: Literal['array']
    name: str
    size: str
    min: int = Field(default=0)
    max: int = Field(default=10**9)

    def generate(self, context):
        size = resolve(self.size, context)
        arr = [Int(
            type='int',
            name='NOCONTEXT',
            min=self.min,
            max=self.max
        ).generate(context) for _ in range(size)]

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

