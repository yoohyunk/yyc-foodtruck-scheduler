"use client";

import React, {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  ReactElement,
  useRef,
} from "react";
import ErrorModal from "../components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  createValidationRule,
} from "../../lib/formValidation";
import { useAuth } from "@/contexts/AuthContext";

interface TimeOffRequestFormData {
  type: string;
  date: string;
  duration: string;
  reason: string;
  [key: string]: unknown;
}
import { FiCalendar } from "react-icons/fi";
import { TimeOffRequest } from "../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { employeesApi } from "@/lib/supabase/employees";
import { Employee } from "../types";

export default function RequestsPage(): ReactElement {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    type: "",
    date: "",
    duration: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Refs for form fields
  const typeRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsData, employeesData] = await Promise.all([
          timeOffRequestsApi.getAllTimeOffRequests(),
          employeesApi.getAllEmployees(),
        ]);
        setRequests(requestsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await timeOffRequestsApi.updateTimeOffRequest(requestId, {
        status: newStatus,
      });
      // Refresh the requests list
      const updatedRequests = await timeOffRequestsApi.getAllTimeOffRequests();
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await timeOffRequestsApi.deleteTimeOffRequest(requestId);
      // Refresh the requests list
      const updatedRequests = await timeOffRequestsApi.getAllTimeOffRequests();
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const formatDateOnly = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString();
  };

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffInMs = end.getTime() - start.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInDays >= 1) {
      return `${Math.floor(diffInDays)} day${Math.floor(diffInDays) !== 1 ? "s" : ""}`;
    } else {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? "s" : ""}`;
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationRules: ValidationRule[] = [
      createValidationRule(
        "type",
        true,
        undefined,
        "Request type is required.",
        typeRef.current
      ),
      createValidationRule(
        "date",
        true,
        undefined,
        "Date is required.",
        dateRef.current
      ),
      createValidationRule(
        "duration",
        true,
        undefined,
        "Duration is required.",
        durationRef.current
      ),
      createValidationRule(
        "reason",
        true,
        undefined,
        "Reason is required.",
        reasonRef.current
      ),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const employee = employees.find((emp) => emp.user_email === user?.email);
      if (!employee) {
        throw new Error("Employee not found");
      }

      const startDateTime = new Date(formData.date);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(
        startDateTime.getHours() + parseInt(formData.duration)
      );

      await timeOffRequestsApi.createTimeOffRequest({
        employee_id: employee.employee_id,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        reason: formData.reason,
        type: formData.type,
        status: "Pending",
      });

      setSuccess("Time off request submitted successfully!");
      setFormData({
        type: "",
        date: "",
        duration: "",
        reason: "",
      });
      setShowModal(false);

      // Refresh the requests list
      const updatedRequests = await timeOffRequestsApi.getAllTimeOffRequests();
      setRequests(updatedRequests);
    } catch (error) {
      console.error("Error submitting request:", error);
      setValidationErrors([
        {
          field: "submit",
          message: "Failed to submit request. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-500">Loading requests...</p>
      </div>
    );
  }

  return (
    <>
      <div className="requests-page">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Time Off Requests</h1>
          <button
            onClick={() => setShowModal(true)}
            className="button bg-blue-600 text-white"
          >
            <FiCalendar className="mr-2" />
            New Request
          </button>
        </div>

        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}

        <div className="requests-list">
          {requests.map((request) => {
            const employee = employees.find(
              (emp) => emp.employee_id === request.employee_id
            );

            return (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3 className="request-title">
                    {employee
                      ? `${employee.first_name} ${employee.last_name}`
                      : "Unknown Employee"}
                  </h3>
                  <span
                    className={`request-status request-status-${request.status.toLowerCase()}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <p>
                    <strong>Type:</strong> {request.type}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {formatDateOnly(request.start_datetime)}
                  </p>
                  <p>
                    <strong>Duration:</strong>{" "}
                    {calculateDuration(
                      request.start_datetime,
                      request.end_datetime
                    )}
                  </p>
                  {request.reason && (
                    <p>
                      <strong>Reason:</strong> {request.reason}
                    </p>
                  )}
                </div>
                <div className="request-actions">
                  {request.status === "Pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(request.id, "Approved")
                        }
                        className="button bg-green-600 text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(request.id, "Rejected")
                        }
                        className="button bg-red-600 text-white"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="button bg-gray-600 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* New Request Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h3 className="modal-title">New Time Off Request</h3>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="input-group">
                  <label htmlFor="type" className="input-label">
                    Request Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    ref={typeRef}
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select Type</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal">Personal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="date" className="input-label">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={dateRef}
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="duration" className="input-label">
                    Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={durationRef}
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="24"
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="reason" className="input-label">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={reasonRef}
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
