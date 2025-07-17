"use client";

import React, { useState, ReactElement, FormEvent } from "react";
import ErrorModal from "@/app/components/ErrorModal";

export default function AddShiftPage(): ReactElement {
  const [formData, setFormData] = useState({
    shiftName: "",
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.shiftName) errors.push("Shift name is required.");
    if (!formData.date) errors.push("Date is required.");
    if (!formData.startTime) errors.push("Start time is required.");
    if (!formData.endTime) errors.push("End time is required.");
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
    // TODO: Add shift creation logic here
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Shift created! (This is a placeholder)");
    }, 1000);
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
        errors={validationErrors.map((msg) => ({ field: "", message: msg, element: null }))}
      />
    </div>
  );
} 