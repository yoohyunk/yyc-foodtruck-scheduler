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
  validateNumber,
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
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { TimeOffRequest } from "../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { employeesApi } from "@/lib/supabase/employees";
import { Employee } from "../types";

export default function RequestsPage(): ReactElement {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    type: "",
    date: "",
    duration: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Refs for form fields
  const typeRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLSelectElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all time off requests and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all time off requests
        const requestsData = await timeOffRequestsApi.getAllTimeOffRequests();
        setRequests(requestsData);

        // Fetch all employees for employee details
        const employeesData = await employeesApi.getAllEmployees();
        setEmployees(employeesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load time off requests.");
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

      // Update local state
      setRequests(
        requests.map((request) =>
          request.id === requestId ? { ...request, status: newStatus } : request
        )
      );
    } catch (err) {
      console.error("Error updating request status:", err);
      alert("Failed to update request status. Please try again.");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await timeOffRequestsApi.deleteTimeOffRequest(requestId);
      setRequests(requests.filter((request) => request.id !== requestId));
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request. Please try again.");
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unknown Employee";
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    return employee
      ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
          "Unknown Name"
      : "Unknown Employee";
  };

  const requestTypes = ["Vacation", "Sick Leave", "Personal Day", "Other"];
  const durationOptions = ["Half Day", "Full Day", "Multiple Days"];
  
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());

    // Calculate days, hours, and minutes
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    // Format the duration string
    let duration = "";

    if (diffDays > 0) {
      duration += `${diffDays} day${diffDays > 1 ? "s" : ""}`;
      if (diffHours > 0) {
        duration += ` ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      }
    } else if (diffHours > 0) {
      duration += `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      if (diffMinutes > 0) {
        duration += ` ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      }
    } else {
      duration += `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }

    return duration;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    // Check if user is authenticated
    if (!user) {
      setValidationErrors([
        {
          field: "auth",
          message: "You must be logged in to submit a time-off request.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setIsSubmitting(false);
      return;
    }

    // Get employee ID from user
    const currentEmployee = employees.find((emp) => emp.user_id === user.id);
    if (!currentEmployee) {
      setValidationErrors([
        {
          field: "employee",
          message: "Employee profile not found. Please contact administrator.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setIsSubmitting(false);
      return;
    }

    // Validate form data
    const validationRules: ValidationRule[] = [
      createValidationRule(
        "type",
        true,
        undefined,
        "Type of leave is required.",
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
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      setIsSubmitting(false);
      return;
    }

    try {
      // Create time off request
      const timeOffRequestData = {
        employee_id: currentEmployee.employee_id,
        type: formData.type,
        start_datetime: `${formData.date}T00:00:00`,
        end_datetime: `${formData.date}T23:59:59`,
        reason: formData.reason || "",
        status: "Pending",
      };

      await timeOffRequestsApi.createTimeOffRequest(timeOffRequestData);

      // Reset form and close modal
      setFormData({
        type: "",
        date: "",
        duration: "",
        reason: "",
      });
      setShowModal(false);
      setSuccess("Time-off request submitted successfully!");

      // Refresh requests
      const updatedRequests = await timeOffRequestsApi.getAllTimeOffRequests();
      setRequests(updatedRequests);
    } catch (err) {
      console.error("Error submitting request:", err);
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
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading time-off requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 text-lg">{error}</p>
        <button onClick={() => window.location.reload()} className="button mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Time-Off Requests</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-gray-100 transition"
          >
            + Request Time-Off
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-left text-sm text-gray-600">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item, index) => (
                <tr key={index} className="text-sm border-b border-gray-200">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <FiCalendar size={16} />
                      <span className="inline-block">
                        {formatDateOnly(item.start_datetime)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">{item.type}</td>
                  <td className="p-3">
                    {calculateDuration(item.start_datetime, item.end_datetime)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`badge ${
                        item.status === "Approved"
                          ? "bg-green-100 text-green-600"
                          : item.status === "Pending"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">{item.reason || "No reason provided"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {item.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "Approved")}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(item.id, "Denied")}
                            className="text-red-600 hover:text-red-800"
                          >
                            Deny
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inline Form */}
        {showModal && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Request Time-Off</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Type of Leave <span className="text-red-500">*</span>
                </label>
                <select
                  ref={typeRef}
                  name="type"
                  className="w-full border p-2 rounded"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select type</option>
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  ref={dateRef}
                  type="date"
                  name="date"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  ref={durationRef}
                  name="duration"
                  className="w-full border p-2 rounded"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
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
                <label className="block mb-1 text-sm font-medium">Reason</label>
                <textarea
                  ref={reasonRef}
                  name="reason"
                  rows={3}
                  className="w-full border p-2 rounded"
                  placeholder="Optional"
                  value={formData.reason}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-gray-100 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
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
