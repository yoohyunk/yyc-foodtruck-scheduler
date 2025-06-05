"use client";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
  ReactElement,
} from "react";
import { Employee, EmployeeFormData } from "@/app/types";

export default function EditEmployeePage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: "",
    address: "",
    role: "",
    email: "",
    phone: "",
    wage: "",
    isAvailable: false,
    availability: [],
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Fetch employee details
  useEffect(() => {
    if (!id) return;

    fetch("/employees.json")
      .then((response) => response.json())
      .then((data: Employee[]) => {
        const employeeData = data.find(
          (emp) => emp.id === parseInt(id as string)
        );
        if (employeeData) {
          setFormData({
            name: employeeData.name || "",
            address: employeeData.address || "",
            role: employeeData.role || "",
            email: employeeData.email || "",
            phone: employeeData.phone || "",
            wage: employeeData.wage || "",
            isAvailable: employeeData.isAvailable || false,
            availability: employeeData.availability || [],
          });
        } else {
          console.error("Employee not found");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching employee:", error);
        setIsLoading(false);
      });
  }, [id]);

  // Handle form input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDaySelection = (day: string) => {
    if (formData.availability.includes(day)) {
      // Remove day if already selected
      setFormData({
        ...formData,
        availability: formData.availability.filter((d) => d !== day),
      });
    } else {
      // Add day if not already selected
      setFormData({
        ...formData,
        availability: [...formData.availability, day],
      });
    }
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all days
      setFormData({
        ...formData,
        availability: [...daysOfWeek],
      });
    } else {
      // Deselect all days
      setFormData({
        ...formData,
        availability: [],
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    fetch(`/employees/${id}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (response.ok) {
          alert("Employee updated successfully!");
          router.push("/employees");
        } else {
          alert("Failed to update employee.");
        }
      })
      .catch((error) => {
        console.error("Error updating employee:", error);
        alert("An error occurred while updating the employee.");
      });
  };

  const handleDelete = async () => {
    try {
      // Get current employees
      const response = await fetch('/employees.json');
      const currentEmployees = await response.json();
      
      // Filter out the employee to delete
      const updatedEmployees = currentEmployees.filter(
        (emp: Employee) => emp.id !== parseInt(id as string)
      );

      // Save updated list
      const saveResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployees),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to delete employee');
      }

      // Navigate back to employees list
      router.push('/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="edit-employee-page">
      <div className="flex justify-between items-center mb-4">
        <button className="button" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Employee</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block font-medium">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select Role</option>
            <option value="Driver">Driver</option>
            <option value="Server">Server</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block font-medium">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Wage */}
        <div>
          <label htmlFor="wage" className="block font-medium">
            Wage
          </label>
          <input
            type="number"
            id="wage"
            name="wage"
            value={formData.wage}
            onChange={handleChange}
            className="input-field"
            required
          />
        </div>

        {/* Is Available */}
        <div>
          <label htmlFor="isAvailable" className="block font-medium">
            <input
              type="checkbox"
              id="isAvailable"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
            />
            Is Available
          </label>
        </div>

        {/* Availability */}
        <div>
          <label className="block font-medium">
            Availability (Days of the Week)
          </label>
          <div className="availability-options">
            <label className="availability-label">
              <input
                type="checkbox"
                checked={formData.availability.length === daysOfWeek.length}
                onChange={handleSelectAll}
              />
              Select All
            </label>
            {daysOfWeek.map((day) => (
              <label key={day} className="availability-label">
                <input
                  type="checkbox"
                  checked={formData.availability.includes(day)}
                  onChange={() => handleDaySelection(day)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '2rem', marginLeft: '1rem' }}>
            <button type="submit" className="button">
              Save Changes
            </button>
            <button
              type="button"
              className="button bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Employee
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 400,
            border: '4px solid #ef4444',
            fontFamily: 'sans-serif',
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</span>
            <p style={{ color: '#b91c1c', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center', letterSpacing: '0.03em' }}>
              Confirm Delete
            </p>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#4b5563', fontSize: '1rem' }}>
              Are you sure you want to delete {formData.name}? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#e5e7eb',
                  color: '#4b5563',
                  fontWeight: 700,
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
                onClick={() => setShowDeleteModal(false)}
                onMouseOver={e => (e.currentTarget.style.background = '#d1d5db')}
                onMouseOut={e => (e.currentTarget.style.background = '#e5e7eb')}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 700,
                  borderRadius: '0.5rem',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background 0.2s',
                }}
                onClick={handleDelete}
                onMouseOver={e => (e.currentTarget.style.background = '#dc2626')}
                onMouseOut={e => (e.currentTarget.style.background = '#ef4444')}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
