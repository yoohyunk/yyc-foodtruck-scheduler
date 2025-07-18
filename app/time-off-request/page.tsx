"use client";

import { useState, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import { TimeOffRequestFormData } from "../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "../components/ErrorModal";
import { ValidationError } from "@/lib/formValidation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function TimeOffRequestPage(): ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    start_datetime: "",
    end_datetime: "",
    reason: "",
    type: "",
  });

  // Date and time state for pickers
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const { shouldHighlight } = useTutorial();

  // Refs for form fields
  const startDateRef = useRef<DatePicker>(null);
  const endDateRef = useRef<DatePicker>(null);
  const startTimeRef = useRef<DatePicker>(null);
  const endTimeRef = useRef<DatePicker>(null);

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalErrors, setErrorModalErrors] = useState<ValidationError[]>(
    []
  );
  const [errorModalTitle, setErrorModalTitle] = useState<string>("");
  const [errorModalType, setErrorModalType] = useState<"error" | "success">(
    "error"
  );

  // Error handling helper functions
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("error");
    setShowErrorModal(true);
  };

  const showSuccess = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("success");
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  // Function to combine date and time into a local datetime string (no timezone conversion)
  const combineDateTime = (date: Date | null, time: Date | null): string => {
    if (!date || !time) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(time.getHours()).padStart(2, "0");
    const minutes = String(time.getMinutes()).padStart(2, "0");

    // Return as local datetime string without timezone info
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  };

  // Date and time change handlers
  const handleStartDateChange = (date: Date | null) => {
    setSelectedStartDate(date);
    if (date) {
      setSelectedEndDate(date); // Set end date to same as start date
      updateFormData();
    }
    setDateError(null);
  };

  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    updateFormData();
    setDateError(null);
  };

  const handleStartTimeChange = (time: Date | null) => {
    setSelectedStartTime(time);
    if (time && !selectedEndTime) {
      // Set end time to 1 hour after start time if not set
      const endTime = new Date(time.getTime() + 60 * 60 * 1000);
      setSelectedEndTime(endTime);
    }
    updateFormData();
    setDateError(null);
  };

  const handleEndTimeChange = (time: Date | null) => {
    setSelectedEndTime(time);
    updateFormData();
    setDateError(null);
  };

  const updateFormData = () => {
    const startDateTime = combineDateTime(selectedStartDate, selectedStartTime);
    const endDateTime = combineDateTime(selectedEndDate, selectedEndTime);

    setFormData((prev) => ({
      ...prev,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form first
    const errors = validateForm();
    if (errors.length > 0) {
      setErrorModalTitle("Form Validation Errors");
      setErrorModalErrors(errors);
      setErrorModalType("error");
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setDateError(null);

    try {
      if (!user) {
        showError(
          "Authentication Error",
          "Please log in to submit a time off request."
        );
        return;
      }

      // Validate dates
      if (
        !selectedStartDate ||
        !selectedEndDate ||
        !selectedStartTime ||
        !selectedEndTime
      ) {
        setDateError("Please select both start and end dates and times.");
        setIsSubmitting(false);
        return;
      }

      const startDateTimeString = combineDateTime(
        selectedStartDate,
        selectedStartTime
      );
      const endDateTimeString = combineDateTime(
        selectedEndDate,
        selectedEndTime
      );

      if (!startDateTimeString || !endDateTimeString) {
        setDateError("Please select both start and end dates and times.");
        setIsSubmitting(false);
        return;
      }

      // Create Date objects for validation (but store strings in DB)
      const startDateTime = new Date(startDateTimeString);
      const endDateTime = new Date(endDateTimeString);
      const currentDate = new Date();

      if (startDateTime < currentDate) {
        setDateError("Start date and time cannot be in the past.");
        setIsSubmitting(false);
        return;
      }

      if (endDateTime < currentDate) {
        setDateError("End date and time cannot be in the past.");
        setIsSubmitting(false);
        return;
      }

      if (startDateTime >= endDateTime) {
        setDateError("End date and time must be after start date and time.");
        setIsSubmitting(false);
        return;
      }

      // Get employee ID for current user
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("user_id", user.id)
        .single();

      if (employeeError || !employee) {
        showError(
          "Employee Error",
          "Employee information not found. Please contact your administrator."
        );
        return;
      }

      await timeOffRequestsApi.createTimeOffRequest({
        employee_id: employee.employee_id,
        start_datetime: startDateTimeString,
        end_datetime: endDateTimeString,
        reason: formData.reason,
        type: formData.type,
        status: "Pending",
      });

      // Show success message and redirect
      showSuccess("Success", "Time off request submitted successfully!");
      setTimeout(() => {
        router.push("/requests");
      }, 2000);
    } catch (err) {
      console.error("Error submitting time off request:", err);
      showError(
        "Submission Error",
        "Failed to submit time off request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check required fields
    if (!selectedStartDate) {
      errors.push({
        field: "startDate",
        message: "Start date is required.",
        element: null,
      });
    }

    if (!selectedEndDate) {
      errors.push({
        field: "endDate",
        message: "End date is required.",
        element: null,
      });
    }

    if (!selectedStartTime) {
      errors.push({
        field: "startTime",
        message: "Start time is required.",
        element: null,
      });
    }

    if (!selectedEndTime) {
      errors.push({
        field: "endTime",
        message: "End time is required.",
        element: null,
      });
    }

    if (!formData.reason.trim()) {
      errors.push({
        field: "reason",
        message: "Reason for time off is required.",
        element: null,
      });
    }

    if (!formData.type) {
      errors.push({
        field: "type",
        message: "Type of time off is required.",
        element: null,
      });
    }

    // Check date/time logic if we have all the required fields
    if (
      selectedStartDate &&
      selectedEndDate &&
      selectedStartTime &&
      selectedEndTime
    ) {
      const startDateTime = new Date(
        selectedStartDate.getFullYear(),
        selectedStartDate.getMonth(),
        selectedStartDate.getDate(),
        selectedStartTime.getHours(),
        selectedStartTime.getMinutes(),
        0,
        0
      );

      const endDateTime = new Date(
        selectedEndDate.getFullYear(),
        selectedEndDate.getMonth(),
        selectedEndDate.getDate(),
        selectedEndTime.getHours(),
        selectedEndTime.getMinutes(),
        0,
        0
      );

      const currentDate = new Date();

      if (startDateTime >= endDateTime) {
        errors.push({
          field: "datetime",
          message: "End date and time must be after start date and time.",
          element: null,
        });
      }

      if (startDateTime < currentDate) {
        errors.push({
          field: "startDateTime",
          message: "Start date and time cannot be in the past.",
          element: null,
        });
      }
    }

    return errors;
  };

  const isFormValid = () => {
    const errors = validateForm();
    return errors.length === 0;
  };

  return (
    <div className="time-off-request-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-dark">
          Request Time Off
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {dateError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{dateError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".start-date-field")}
              className="start-date-field"
            >
              <div className="input-group">
                <label htmlFor="startDate" className="input-label">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  ref={startDateRef}
                  selected={selectedStartDate}
                  onChange={handleStartDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={new Date()}
                  className="input-field"
                  placeholderText="Select start date"
                />
              </div>
            </TutorialHighlight>

            <TutorialHighlight
              isHighlighted={shouldHighlight(".end-date-field")}
              className="end-date-field"
            >
              <div className="input-group">
                <label htmlFor="endDate" className="input-label">
                  End Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  ref={endDateRef}
                  selected={selectedEndDate}
                  onChange={handleEndDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={selectedStartDate || new Date()}
                  className="input-field"
                  placeholderText="Select end date"
                />
              </div>
            </TutorialHighlight>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".start-time-field")}
              className="start-time-field"
            >
              <div className="input-group">
                <label htmlFor="startTime" className="input-label">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  ref={startTimeRef}
                  selected={selectedStartTime}
                  onChange={handleStartTimeChange}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="h:mm aa"
                  className="input-field"
                  placeholderText="Select start time"
                  openToDate={new Date()}
                  minTime={new Date(0, 0, 0, 0, 0, 0)}
                  maxTime={new Date(0, 0, 0, 23, 59, 59)}
                />
              </div>
            </TutorialHighlight>

            <TutorialHighlight
              isHighlighted={shouldHighlight(".end-time-field")}
              className="end-time-field"
            >
              <div className="input-group">
                <label htmlFor="endTime" className="input-label">
                  End Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  ref={endTimeRef}
                  selected={selectedEndTime}
                  onChange={handleEndTimeChange}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="End Time"
                  dateFormat="h:mm aa"
                  className="input-field"
                  placeholderText="Select end time"
                  openToDate={new Date()}
                  minTime={new Date(0, 0, 0, 0, 0, 0)}
                  maxTime={new Date(0, 0, 0, 23, 59, 59)}
                />
              </div>
            </TutorialHighlight>
          </div>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".type-field")}
            className="type-field"
          >
            <div className="input-group">
              <label htmlFor="type" className="input-label">
                Type of Time Off <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">Select a type</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal Leave">Personal Leave</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </TutorialHighlight>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".reason-field")}
            className="reason-field"
          >
            <div className="input-group">
              <label htmlFor="reason" className="input-label">
                Reason for Time Off <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Please provide a detailed reason for your time off request..."
                className="input-field"
              />
            </div>
          </TutorialHighlight>

          <div className="flex gap-4 pt-6">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".submit-button")}
              className="submit-button"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn flex-1 ${
                  isFormValid()
                    ? "btn-primary"
                    : "btn-secondary opacity-50 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!isFormValid()) {
                    e.preventDefault();
                    const errors = validateForm();
                    setErrorModalTitle("Please Fix the Following Issues");
                    setErrorModalErrors(errors);
                    setErrorModalType("error");
                    setShowErrorModal(true);
                  }
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </TutorialHighlight>

            <TutorialHighlight
              isHighlighted={shouldHighlight(".cancel-button")}
              className="cancel-button"
            >
              <button
                type="button"
                onClick={() => router.push("/requests")}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </TutorialHighlight>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Important Notes:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Please submit your request at least 2 weeks in advance</li>
            <li>• Your request will be reviewed by management</li>
            <li>
              • Emergency requests may be considered on a case-by-case basis
            </li>
          </ul>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        errors={errorModalErrors}
        title={errorModalTitle}
        type={errorModalType}
      />

      {/* Validation Status Indicator */}
      {!isFormValid() && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-yellow-800 text-sm font-medium">
              Please complete all required fields to submit your request
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
