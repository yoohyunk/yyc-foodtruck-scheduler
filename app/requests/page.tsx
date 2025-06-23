"use client";

import React, { useState, FormEvent, ChangeEvent, ReactElement, useRef } from "react";
import ErrorModal from "../components/ErrorModal";
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validateRequired, validateDate, createValidationRule } from "../../lib/formValidation";

interface TimeOffRequestFormData {
  type: string;
  date: string;
  duration: string;
  reason: string;
}

export default function TimeOff(): ReactElement {
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    type: "",
    date: "",
    duration: "",
    reason: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Refs for form fields
  const typeRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLSelectElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const requestTypes = ["Vacation", "Sick Leave", "Personal Day", "Other"];
  const durationOptions = ["Half Day", "Full Day", "Multiple Days"];

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors([]);
    setSuccess("");

    const validationRules: ValidationRule[] = [
      createValidationRule("type", true, undefined, "Request type is required.", typeRef.current),
      createValidationRule("date", true, (value: any) => {
        const date = new Date(value);
        return date > new Date();
      }, "Date is required and must be in the future.", dateRef.current),
      createValidationRule("duration", true, undefined, "Duration is required.", durationRef.current),
      createValidationRule("reason", true, undefined, "Reason is required.", reasonRef.current),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(error => error.message);
      setFormErrors(errorMessages);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSuccess("Time-off request submitted successfully!");
      setFormData({
        type: "",
        date: "",
        duration: "",
        reason: "",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Submit Time-Off Request
          </h1>

          <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  ref={typeRef}
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select request type</option>
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Date <span className="text-red-500">*</span>
                </label>
                <input
                  ref={dateRef}
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  ref={durationRef}
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select duration</option>
                  {durationOptions.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  ref={reasonRef}
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason for your time-off request..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>

          {success && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
