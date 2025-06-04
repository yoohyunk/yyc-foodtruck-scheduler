"use client";

import React, { useState, ReactElement, ChangeEvent, FormEvent } from "react";
import { FormData, Coordinates } from "@/app/types";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";

export default function CreateEmployee(): ReactElement {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    role: "",
    email: "",
    phone: "",
    wage: "",
    isAvailable: false,
    availability: [], // Array to store selected days of the week
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddressChange = (address: string, coords?: Coordinates) => {
    setFormData({
      ...formData,
      address,
    });
    setCoordinates(coords);
  };

  const handleDaySelection = (day: string): void => {
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

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>): void => {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!coordinates) {
      alert('Please select a valid address from the suggestions');
      return;
    }

    const employeeData = {
      ...formData,
      coordinates: {
        latitude: coordinates.lat,
        longitude: coordinates.lng
      }
    };

    try {
      // Get existing employees
      const response = await fetch('/employees.json');
      const employees = await response.json();
      
      // Generate new ID (max existing ID + 1)
      const newId = Math.max(...employees.map((emp: any) => emp.id)) + 1;
      
      // Create new employee with ID
      const newEmployee = {
        id: newId,
        ...employeeData,
        isAvailable: Boolean(employeeData.isAvailable),
        wage: Number(employeeData.wage)
      };

      // Add new employee to the list
      const updatedEmployees = [...employees, newEmployee];

      // Save updated list
      const saveResponse = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployees),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save employee data');
      }

      // Reset form
      setFormData({
        name: "",
        address: "",
        role: "",
        email: "",
        phone: "",
        wage: "",
        isAvailable: false,
        availability: [],
      });
      setCoordinates(undefined);

      // Show success message
      alert('Employee created successfully!');
      
      // Redirect to employees list
      window.location.href = '/employees';
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to create employee. Please try again.');
    }
  };

  return (
    <div className="create-employee-page">
      <h1 className="form-header">Create Employee</h1>
      <form onSubmit={handleSubmit} className="employee-form">
        <div className="input-group">
          <label htmlFor="name" className="input-label">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="address" className="input-label">
            Address
          </label>
          <AddressAutocomplete
            value={formData.address}
            onChange={handleAddressChange}
            placeholder="Enter employee address"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="role" className="input-label">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="Driver">Driver</option>
            <option value="Server">Server</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone" className="input-label">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="wage" className="input-label">
            Wage
          </label>
          <input
            type="number"
            id="wage"
            name="wage"
            value={formData.wage}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="isAvailable" className="input-label">
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

        {/* Availability Selection */}
        <div className="input-group">
          <label className="input-label">Availability (Days of the Week)</label>
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

        <button type="submit" className="button">
          Create Employee
        </button>
      </form>
    </div>
  );
}
