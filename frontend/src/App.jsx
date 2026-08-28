import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8000";

const emptyForm = {
  name: "",
  email: "",
  department: "",
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`);

      if (!response.ok) {
        throw new Error("Unable to load employees");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const url = editingId
      ? `${API_URL}/employees/${editingId}`
      : `${API_URL}/employees`;

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Operation failed");
      }

      setMessage(
        editingId
          ? "Employee updated successfully"
          : "Employee added successfully"
      );

      setForm(emptyForm);
      setEditingId(null);
      await loadEmployees();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startEditing = (employee) => {
    setEditingId(employee.id);

    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
    });

    setMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  const deleteEmployee = async (employeeId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/employees/${employeeId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Delete failed");
      }

      setMessage("Employee deleted successfully");

      if (editingId === employeeId) {
        cancelEditing();
      }

      await loadEmployees();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="container">
      <h1>Employee Manager</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Employee name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          required
        />

        <button type="submit">
          {editingId ? "Update Employee" : "Add Employee"}
        </button>

        {editingId && (
          <button
            type="button"
            className="cancel-button"
            onClick={cancelEditing}
          >
            Cancel
          </button>
        )}
      </form>

      {message && <p className="message">{message}</p>}

      <h2>Employees</h2>

      {employees.length === 0 ? (
        <p>No employees found.</p>
      ) : (
        <ul>
          {employees.map((employee) => (
            <li key={employee.id}>
              <div className="employee-details">
                <strong>{employee.name}</strong>
                <span>{employee.email}</span>
                <span>{employee.department}</span>
              </div>

              <div className="employee-actions">
                <button
                  type="button"
                  onClick={() => startEditing(employee)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteEmployee(employee.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;