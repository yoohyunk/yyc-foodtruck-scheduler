import React, { useState, useEffect, useRef } from "react";
import { Employee } from "@/app/types";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { extractDate, extractTime } from "../../utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ServerAssignment {
  id: string;
  employee_id: string;
  event_id: string;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  status: string;
  employees: Employee;
}

interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: ServerAssignment | null;
  onAssignmentUpdated: () => void;
}

export default function EditAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onAssignmentUpdated,
}: EditAssignmentModalProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Refs for DatePicker components
  const startDateRef = useRef<DatePicker>(null);
  const endDateRef = useRef<DatePicker>(null);
  const startTimeRef = useRef<DatePicker>(null);
  const endTimeRef = useRef<DatePicker>(null);

  // Initialize form when assignment changes
  useEffect(() => {
    if (assignment) {
      // Parse the ISO string to extract date and time components
      const startMatch = assignment.start_date.match(
        /T(\d{2}):(\d{2}):(\d{2})/
      );
      const endMatch = assignment.end_date.match(/T(\d{2}):(\d{2}):(\d{2})/);

      if (startMatch && endMatch) {
        const startHours = parseInt(startMatch[1]);
        const startMinutes = parseInt(startMatch[2]);
        const endHours = parseInt(endMatch[1]);
        const endMinutes = parseInt(endMatch[2]);

        // Create date objects for the date pickers
        const startDate = new Date(assignment.start_date.split("T")[0]);
        const endDate = new Date(assignment.end_date.split("T")[0]);

        // Create time objects for the time pickers
        const startTime = new Date();
        startTime.setHours(startHours, startMinutes, 0, 0);

        const endTime = new Date();
        endTime.setHours(endHours, endMinutes, 0, 0);

        setSelectedStartDate(startDate);
        setSelectedEndDate(endDate);
        setSelectedStartTime(startTime);
        setSelectedEndTime(endTime);
      }
    }
  }, [assignment]);

  // Date and time change handlers
  const handleStartDateChange = (date: Date | null) => {
    setSelectedStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
  };

  const handleStartTimeChange = (time: Date | null) => {
    setSelectedStartTime(time);
  };

  const handleEndTimeChange = (time: Date | null) => {
    setSelectedEndTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    setErrors([]);
    setIsSubmitting(true);

    try {
      // Validate that all required fields are selected
      if (
        !selectedStartDate ||
        !selectedEndDate ||
        !selectedStartTime ||
        !selectedEndTime
      ) {
        setErrors(["Please select all date and time fields"]);
        setIsSubmitting(false);
        return;
      }

      // Create start and end datetime objects
      const startDateTime = new Date(selectedStartDate);
      startDateTime.setHours(
        selectedStartTime.getHours(),
        selectedStartTime.getMinutes(),
        0,
        0
      );

      const endDateTime = new Date(selectedEndDate);
      endDateTime.setHours(
        selectedEndTime.getHours(),
        selectedEndTime.getMinutes(),
        0,
        0
      );

      if (startDateTime >= endDateTime) {
        setErrors(["End time must be after start time"]);
        setIsSubmitting(false);
        return;
      }

      // Create ISO strings that preserve local time without timezone conversion
      const startISO = `${selectedStartDate.toISOString().split("T")[0]}T${selectedStartTime.getHours().toString().padStart(2, "0")}:${selectedStartTime.getMinutes().toString().padStart(2, "0")}:00`;
      const endISO = `${selectedEndDate.toISOString().split("T")[0]}T${selectedEndTime.getHours().toString().padStart(2, "0")}:${selectedEndTime.getMinutes().toString().padStart(2, "0")}:00`;

      // Update the assignment
      await assignmentsApi.updateAssignmentTimes(
        assignment.id,
        startISO,
        endISO
      );

      onAssignmentUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating assignment:", error);
      setErrors(["Failed to update assignment times"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setErrors([]);
    onClose();
  };

  if (!isOpen || !assignment) return null;

  const employeeName =
    `${assignment.employees.first_name || ""} ${assignment.employees.last_name || ""}`.trim();

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Assignment Times</h2>
          <button onClick={handleCancel} className="modal-close" title="Close">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 font-weight-600">
              Employee:
            </p>
            <p className="font-medium text-gray-900 text-lg">{employeeName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Start Date and Time */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label htmlFor="startDate" className="form-label required">
                  Start Date
                </label>
                <DatePicker
                  ref={startDateRef}
                  selected={selectedStartDate}
                  onChange={handleStartDateChange}
                  dateFormat="MMMM d, yyyy"
                  className="form-input"
                  placeholderText="Select start date"
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTime" className="form-label required">
                  Start Time
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
                  className="form-input"
                  placeholderText="Select time"
                  openToDate={new Date()}
                  minTime={new Date(0, 0, 0, 0, 0, 0)}
                  maxTime={new Date(0, 0, 0, 23, 59, 59)}
                />
              </div>
            </div>

            {/* End Date and Time */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label htmlFor="endDate" className="form-label required">
                  End Date
                </label>
                <DatePicker
                  ref={endDateRef}
                  selected={selectedEndDate}
                  onChange={handleEndDateChange}
                  dateFormat="MMMM d, yyyy"
                  minDate={selectedStartDate || new Date()}
                  className="form-input"
                  placeholderText="Select end date"
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime" className="form-label required">
                  End Time
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
                  className="form-input"
                  placeholderText="Select end time"
                  openToDate={new Date()}
                  minTime={new Date(0, 0, 0, 0, 0, 0)}
                  maxTime={new Date(0, 0, 0, 23, 59, 59)}
                />
              </div>
            </div>

            {/* Current Times Display */}
            <div className="alert alert-info">
              <span className="font-weight-600">Current Assignment:</span>
              <span className="ml-2">
                {extractDate(assignment.start_date, assignment.end_date)} •{" "}
                {extractTime(assignment.start_date)} -{" "}
                {extractTime(assignment.end_date)}
              </span>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="alert alert-error">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="loading"></div>
                Updating...
              </>
            ) : (
              "Update Times"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
