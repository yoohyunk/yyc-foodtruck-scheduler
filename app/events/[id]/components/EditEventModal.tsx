import React, { useRef, useState } from "react";
import { EventFormData } from "@/app/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ErrorModal from "@/app/components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  validateEmail,
  validateNumber,
  createValidationRule,
} from "@/lib/formValidation";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: EventFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedDate: Date | null;
  selectedTime: Date | null;
  selectedEndTime: Date | null;
  isSubmitting: boolean;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  setEditFormData: (data: EventFormData) => void;
}

export default function EditEventModal({
  isOpen,
  onClose,
  formData,
  onFormChange,
  selectedDate,
  selectedTime,
  selectedEndTime,
  isSubmitting,
  onDateChange,
  onTimeChange,
  onEndTimeChange,
  onSubmit,
  setEditFormData,
}: EditEventModalProps) {
  // Move all useRef calls to the top level
  const nameRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactPhoneRef = useRef<HTMLInputElement>(null);
  const requiredServersRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const endTimeRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationRules: ValidationRule[] = [
      createValidationRule(
        "name",
        true,
        undefined,
        "Event name is required.",
        nameRef.current
      ),
      createValidationRule(
        "date",
        true,
        undefined,
        "Date is required.",
        dateRef.current
      ),
      createValidationRule(
        "time",
        true,
        undefined,
        "Start time is required.",
        timeRef.current
      ),
      createValidationRule(
        "endTime",
        true,
        undefined,
        "End time is required.",
        endTimeRef.current
      ),
      createValidationRule(
        "location",
        true,
        undefined,
        "Location is required.",
        locationRef.current
      ),
      createValidationRule(
        "requiredServers",
        true,
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 1),
        "Number of servers is required and must be at least 1.",
        requiredServersRef.current
      ),
      createValidationRule(
        "contactName",
        false,
        undefined,
        undefined,
        contactNameRef.current
      ),
      createValidationRule(
        "contactEmail",
        false,
        (value: unknown) =>
          typeof value === "string" && (value === "" || validateEmail(value)),
        "Please enter a valid email address.",
        contactEmailRef.current
      ),
      createValidationRule(
        "contactPhone",
        false,
        undefined,
        undefined,
        contactPhoneRef.current
      ),
    ];

    const errors = validateForm(
      formData as Record<string, unknown>,
      validationRules
    );

    // Additional custom validation: end time after start time
    if (selectedTime && selectedEndTime && selectedTime >= selectedEndTime) {
      errors.push({
        field: "endTime",
        message: "End time must be after start time.",
        element: endTimeRef.current,
      });
    }

    setValidationErrors(errors);
    if (errors.length > 0) {
      setShowErrorModal(true);
      return;
    }
    onSubmit(e);
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-container max-w-2xl">
          <h3 className="modal-title">Edit Event</h3>
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div ref={dateRef}>
                  <DatePicker
                    selected={selectedDate}
                    onChange={onDateChange}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div ref={timeRef}>
                  <DatePicker
                    selected={selectedTime}
                    onChange={onTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <div ref={endTimeRef}>
                  <DatePicker
                    selected={selectedEndTime}
                    onChange={onEndTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="h:mm aa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select time"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  ref={locationRef}
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Servers <span className="text-red-500">*</span>
                </label>
                <input
                  ref={requiredServersRef}
                  type="number"
                  name="requiredServers"
                  value={formData.requiredServers}
                  onChange={onFormChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  ref={contactNameRef}
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  ref={contactEmailRef}
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  ref={contactPhoneRef}
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isPrepaid"
                    checked={formData.isPrepaid}
                    onChange={(e) =>
                      setEditFormData({
                        ...formData,
                        isPrepaid: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Prepaid
                  </span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
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
