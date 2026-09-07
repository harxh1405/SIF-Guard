from typing import List, Optional
from pydantic import BaseModel


class LSRRead(BaseModel):
    id: str
    rule_code: str
    rule_name: str
    description: str
    keywords: List[str]
    icon: Optional[str] = None

    class Config:
        from_attributes = True
