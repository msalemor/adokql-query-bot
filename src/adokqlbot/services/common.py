from pydantic import BaseModel


class UIColumn(BaseModel):
    field: str
    width: int = 150
