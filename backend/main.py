from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import Base, Employee
from schemas import EmployeeCreate, EmployeeResponse

from prometheus_fastapi_instrumentator import Instrumentator

# Create database tables if they do not already exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Employee Manager API")


# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create and close a database session for each request
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Health-check endpoint
@app.get("/")
def health():
    return {"status": "healthy"}


# Create employee
@app.post("/employees", response_model=EmployeeResponse)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
):
    existing_employee = (
        db.query(Employee)
        .filter(Employee.email == employee.email)
        .first()
    )

    if existing_employee:
        raise HTTPException(
            status_code=409,
            detail="An employee with this email already exists",
        )

    new_employee = Employee(
        name=employee.name,
        email=employee.email,
        department=employee.department,
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


# Get all employees
@app.get("/employees", response_model=list[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.id).all()


# Get one employee
@app.get(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    return employee


# Update employee
@app.put(
    "/employees/{employee_id}",
    response_model=EmployeeResponse,
)
def update_employee(
    employee_id: int,
    updated_employee: EmployeeCreate,
    db: Session = Depends(get_db),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    employee_with_same_email = (
        db.query(Employee)
        .filter(
            Employee.email == updated_employee.email,
            Employee.id != employee_id,
        )
        .first()
    )

    if employee_with_same_email:
        raise HTTPException(
            status_code=409,
            detail="Another employee already uses this email",
        )

    employee.name = updated_employee.name
    employee.email = updated_employee.email
    employee.department = updated_employee.department

    db.commit()
    db.refresh(employee)

    return employee


# Delete employee
@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):
    employee = (
        db.query(Employee)
        .filter(Employee.id == employee_id)
        .first()
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully"}

Instrumentator().instrument(app).expose(app)
