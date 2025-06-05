"use client";

import React, { useState, ReactElement, ChangeEvent, FormEvent, useRef } from "react";
import { EmployeeFormData, Coordinates } from "@/app/types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import HelpPopup from "@/app/components/HelpPopup";
import { useTutorial } from "@/app/tutorial";
import { useRouter } from "next/navigation";

export default function CreateEmployee(): ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState<EmployeeFormData>({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const { startTutorial } = useTutorial();
  const addressFormRef = useRef<AddressFormRef>(null);

  // Show help popup when tutorial starts
  React.useEffect(() => {
    const handleTutorialStart = () => {
      setShowHelpPopup(true);
    };

    // Add event listener for tutorial start
    window.addEventListener('tutorial:start', handleTutorialStart);

    return () => {
      window.removeEventListener('tutorial:start', handleTutorialStart);
    };
  }, []);

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
        availability: formData.availability.filter((d: string) => d !== day),
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

    const errorList: string[] = [];
    if (!formData.name.trim()) errorList.push('Name is required.');
    if (!formData.address.trim()) errorList.push('Address is required.');
    if (!coordinates) errorList.push('Please check address.');
    if (!formData.role.trim()) errorList.push('Role is required.');
    if (!formData.email.trim()) errorList.push('Email is required.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errorList.push('Please enter a valid email address.');
    if (!formData.phone.trim()) errorList.push('Phone is required.');
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ''))) errorList.push('Please enter a valid phone number.');
    if (!formData.wage) errorList.push('Wage is required.');
    else if (Number(formData.wage) <= 0) errorList.push('Wage must be greater than 0.');
    if (formData.availability.length === 0) errorList.push('Please select at least one day of availability.');
    if (errorList.length > 0) {
      setFormErrors(errorList);
      setShowErrorModal(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const employeeData = {
        ...formData,
        coordinates: coordinates ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        } : undefined
      };

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
      router.push('/employees');
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="address" className="input-label">
                Address
              </label>
              <button
                type="button"
                onClick={() => setShowHelpPopup(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>
            </div>
            <AddressForm
              ref={addressFormRef}
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

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span
                  style={{
                    display: 'inline-block',
                    height: '1.5rem',
                    width: '1.5rem',
                    marginRight: '0.5rem',
                    verticalAlign: 'middle',
                    border: '3px solid #22c55e', // Tailwind green-500
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Creating...
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </span>
            ) : (
              'Create Employee'
            )}
          </button>
        </form>
      </div>
      <HelpPopup isOpen={showHelpPopup} onClose={() => setShowHelpPopup(false)} />
    </>
  );
}
