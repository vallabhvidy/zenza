from pydantic import BaseModel, Field
from typing import Literal
from shared.models.input import Input, Int

class Code(BaseModel):
    code: str = Field(..., max_length=500_000)
    language: Literal['cpp', 'python']
    input_schema: Input = Field(...)
    x_var: Int = Field(...)
    reduce_noise: bool = Field(default=False)
    search: bool = Field(default=False)
