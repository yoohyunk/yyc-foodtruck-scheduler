import React, { useState, useEffect } from "react";
import { Employee } from "@/app/types";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { extractDate, extractTime } from "../../utils";

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
  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form when assignment changes
  useEffect(() => {
    if (assignment) {
      const start = new Date(assignment.start_date);
      const end = new Date(assignment.end_date);

      setStartDate(start.toISOString().split("T")[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split("T")[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    }
  }, [assignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    setErrors([]);
    setIsSubmitting(true);

    try {
      // Validate times
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (startDateTime >= endDateTime) {
        setErrors(["End time must be after start time"]);
        setIsSubmitting(false);
        return;
      }

      // Update the assignment
      await assignmentsApi.updateAssignmentTimes(
        assignment.id,
        startDateTime.toISOString(),
        endDateTime.toISOString()
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
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="startTime" className="form-label required">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            {/* End Date and Time */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label htmlFor="endDate" className="form-label required">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime" className="form-label required">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input"
                  required
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
