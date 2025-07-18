"use client";

import React, { useState, ReactElement, FormEvent, useEffect } from "react";
import ErrorModal from "@/app/components/ErrorModal";
import { employeesApi } from "@/lib/supabase/employees";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { Employee } from "@/app/types";

export default function AddShiftPage(): ReactElement {
  const [formData, setFormData] = useState({
    shiftName: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
    employeeId: "",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        const employeesData = await employeesApi.getAllEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setValidationErrors(["Failed to load employees. Please try again."]);
        setShowErrorModal(true);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.shiftName) errors.push("Shift name is required.");
    if (!formData.date) errors.push("Date is required.");
    if (!formData.startTime) errors.push("Start time is required.");
    if (!formData.endTime) errors.push("End time is required.");
    if (!formData.employeeId) errors.push("Employee is required.");
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowErrorModal(true);
      return;
    }
    setIsSubmitting(true);
    
    try {
      // Combine date and time for database
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;
      
      // Create the shift in the database
      await assignmentsApi.createShift(
        formData.employeeId,
        startDateTime,
        endDateTime,
        formData.shiftName,
        formData.notes
      );
      
      // Success - redirect to schedule page
      window.location.href = "/schedule";
    } catch (error) {
      console.error("Error creating shift:", error);
      setValidationErrors([
        error instanceof Error ? error.message : "Failed to create shift. Please try again."
      ]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-shift-page">
      <h1 className="form-header">Create Shift</h1>
      <form onSubmit={handleSubmit} className="shift-form">
        <div className="input-group">
          <label htmlFor="shiftName" className="input-label">
            Shift Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="shiftName"
            name="shiftName"
            value={formData.shiftName}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="employeeId" className="input-label">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            id="employeeId"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="input-field"
            disabled={isLoadingEmployees}
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.employee_id} value={employee.employee_id}>
                {employee.first_name} {employee.last_name} - {employee.employee_type}
              </option>
            ))}
          </select>
          {isLoadingEmployees && (
            <p className="text-sm text-gray-500 mt-1">Loading employees...</p>
          )}
        </div>
        <div className="input-group">
          <label htmlFor="date" className="input-label">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="startTime" className="input-label">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="endTime" className="input-label">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="notes" className="input-label">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Shift"}
        </button>
      </form>
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors.map((msg) => ({
          field: "",
          message: msg,
          element: null,
        }))}
      />
    </div>
  );
}
