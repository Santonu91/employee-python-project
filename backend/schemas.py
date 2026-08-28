from pydantic import BaseModel


class EmployeeCreate(BaseModel):
    name: str
    email: str
    department: str


class EmployeeResponse(EmployeeCreate):
    id: int

    class Config:
        from_attributes = True
