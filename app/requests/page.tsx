"use client";
import { useState, useEffect, ReactElement, useMemo } from "react";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";
import { TimeOffRequest } from "../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { employeesApi } from "@/lib/supabase/employees";
import { Employee } from "../types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ErrorModal from "../components/ErrorModal";
import { ValidationError } from "@/lib/formValidation";

export default function RequestsPage(): ReactElement {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedDate, setSelectedDate] = useState<string>(""); // For date filtering
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("All"); // For employee filtering
  const router = useRouter();

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalErrors, setErrorModalErrors] = useState<ValidationError[]>(
    []
  );
  const [errorModalTitle, setErrorModalTitle] = useState<string>("");
  const [errorModalType, setErrorModalType] = useState<
    "error" | "success" | "confirmation"
  >("error");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    setPendingDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await timeOffRequestsApi.deleteTimeOffRequest(pendingDeleteId);
        setRequests(
          requests.filter((request) => request.id !== pendingDeleteId)
        );
        showSuccess("Success", "Request deleted successfully.");
      } catch (err) {
        console.error("Error deleting request:", err);
        showError(
          "Delete Error",
          "Failed to delete request. Please try again."
        );
      }
    }
    setPendingDeleteId(null);
  };

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
    // Only allow admins to update status
    if (!isAdmin) {
      showError(
        "Access Denied",
        "Only administrators can update request status."
      );
      return;
    }

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

      showSuccess("Success", "Request status updated successfully.");
    } catch (err) {
      console.error("Error updating request status:", err);
      showError(
        "Update Error",
        "Failed to update request status. Please try again."
      );
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    // Only allow admins to delete requests
    if (!isAdmin) {
      showError("Access Denied", "Only administrators can delete requests.");
      return;
    }

    // Store the request ID for deletion and show confirmation modal
    setPendingDeleteId(requestId);
    setErrorModalTitle("Confirm Deletion");
    setErrorModalErrors([
      {
        field: "general",
        message:
          "Are you sure you want to delete this request? This action cannot be undone.",
      },
    ]);
    setErrorModalType("confirmation");
    setShowErrorModal(true);
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Unknown Employee";
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    return employee
      ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
          "Unknown Name"
      : "Unknown Employee";
  };

  // Helper to display local time as selected (no timezone conversion)
  function formatLocalDateTimeString(dateTimeString: string) {
    if (!dateTimeString) return "";
    const [date, time] = dateTimeString.split("T");
    if (!date || !time) return dateTimeString;
    const [hour, minute] = time.split(":");
    return `${date} ${hour}:${minute}`;
  }

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

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Apply status filter
    if (filterStatus !== "All") {
      filtered = filtered.filter((request) => request.status === filterStatus);
    }

    // Apply employee filter (only for admin users)
    if (isAdmin && selectedEmployeeId !== "All") {
      filtered = filtered.filter(
        (request) => request.employee_id === selectedEmployeeId
      );
    }

    // Apply date filter (only for admin users)
    if (isAdmin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate) {
        // If a date is selected, show requests for that date (even if in the past)
        filtered = filtered.filter((request) => {
          const requestDate = new Date(request.start_datetime)
            .toISOString()
            .split("T")[0];
          return requestDate === selectedDate;
        });
      } else {
        // No date selected: show only requests whose end_datetime is today or in the future
        filtered = filtered.filter((request) => {
          const requestEnd = new Date(request.end_datetime);
          requestEnd.setHours(0, 0, 0, 0);
          return requestEnd >= today;
        });
      }
    }

    // Sort filtered requests by start_datetime ascending (soonest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_datetime).getTime();
      const dateB = new Date(b.start_datetime).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [requests, filterStatus, selectedEmployeeId, selectedDate, isAdmin]);

  if (isLoading) {
    return (
      <div className="requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          Time-Off Requests Management
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">
            Loading time off requests...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          Time-Off Requests Management
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-page">
      <div className="mb-6">
        <h2 className="text-2xl text-primary-dark">
          Time-Off Requests Management
        </h2>
      </div>

      {/* Filter Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          className={`button ${filterStatus === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("All")}
        >
          <div className="flex items-center justify-center">
            <FiCalendar
              className={`mr-2 ${filterStatus === "All" ? "text-white" : "text-blue-500"}`}
            />
            <span>All ({requests.length})</span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Pending" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Pending")}
        >
          <div className="flex items-center justify-center">
            <FiClock
              className={`mr-2 ${filterStatus === "Pending" ? "text-white" : "text-yellow-500"}`}
            />
            <span>
              Pending ({requests.filter((r) => r.status === "Pending").length})
            </span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Accepted" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Accepted")}
        >
          <div className="flex items-center justify-center">
            <FiUser
              className={`mr-2 ${filterStatus === "Accepted" ? "text-white" : "text-green-500"}`}
            />
            <span>
              Accepted ({requests.filter((r) => r.status === "Accepted").length}
              )
            </span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Rejected" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Rejected")}
        >
          <div className="flex items-center justify-center">
            <FiUser
              className={`mr-2 ${filterStatus === "Rejected" ? "text-white" : "text-red-500"}`}
            />
            <span>
              Rejected ({requests.filter((r) => r.status === "Rejected").length}
              )
            </span>
          </div>
        </button>
      </div>

      {/* Employee Filter - Only for Admin Users */}
      {isAdmin && (
        <div className="mb-6">
          <label
            htmlFor="employee-filter"
            className="block text-primary-dark font-medium mb-2"
          >
            Filter by Employee
          </label>
          <select
            id="employee-filter"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="input-field w-full cursor-pointer"
          >
            <option value="All">All Employees</option>
            {employees
              .filter((employee) => employee.is_available) // Only show active employees
              .sort((a, b) =>
                `${a.first_name} ${a.last_name}`.localeCompare(
                  `${b.first_name} ${b.last_name}`
                )
              )
              .map((employee) => (
                <option key={employee.employee_id} value={employee.employee_id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Date Filter - Only for Admin Users */}
      {isAdmin && (
        <div className="mb-6">
          <label
            htmlFor="date-filter"
            className="block text-primary-dark font-medium mb-2"
          >
            Filter by Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field w-full cursor-pointer"
              placeholder="Select a date to view past requests"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spacer div above New Request button */}
      <div className="h-5"></div>

      {/* New Request Button - full width under filters */}
      {!isAdmin && (
        <div className="mt-6 mb-8">
          <button
            onClick={() => router.push("/time-off-request")}
            className="button bg-green-600 hover:bg-green-700 text-white w-full py-3 text-lg font-semibold rounded-lg shadow"
          >
            + New Request
          </button>
        </div>
      )}

      {/* Spacer div to ensure visual separation */}
      <div className="h-8"></div>

      {/* Table */}
      <div className="grid gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="employee-card bg-white p-6 rounded shadow relative"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center ">
                  <div>
                    <div className="flex items-center gap-4">
                      <FiUser className="text-gray-400 mr-3 text-lg" />
                      <h3 className="font-semibold text-lg text-gray-800">
                        {getEmployeeName(request.employee_id)}
                      </h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {request.type}
                      </span>
                    </div>
                    {/* Reason Section */}
                    {request.reason && (
                      <div className="bg-gray-50 p-3 rounded-lg flex gap-2">
                        <div className="flex items-center mb-2">
                          <span className="font-medium text-gray-700">
                            Reason for Time Off:
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {request.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      value={request.status}
                      onChange={(e) =>
                        handleStatusUpdate(request.id, e.target.value)
                      }
                      className={`px-3 py-1 rounded text-sm font-medium border-none focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                        request.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        request.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : request.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {request.status}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteRequest(request.id)}
                      className="delete-button"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Date and Time Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiCalendar className="text-blue-500 mr-2" />
                    <span className="font-medium text-gray-700">
                      Start Date & Time
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatLocalDateTimeString(request.start_datetime)}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiCalendar className="text-blue-500 mr-2" />
                    <span className="font-medium text-gray-700">
                      End Date & Time
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatLocalDateTimeString(request.end_datetime)}
                  </span>
                </div>
              </div>

              {/* Duration Calculation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Duration:{" "}
                    {calculateDuration(
                      request.start_datetime,
                      request.end_datetime
                    )}
                  </span>
                  <span>
                    Requested on: {formatDateOnly(request.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No time off requests found.
          </div>
        )}
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        errors={errorModalErrors}
        title={errorModalTitle}
        type={errorModalType}
        onConfirm={
          errorModalType === "confirmation" ? handleConfirmDelete : undefined
        }
        confirmText={errorModalType === "confirmation" ? "Delete" : undefined}
        cancelText={errorModalType === "confirmation" ? "Cancel" : undefined}
      />
    </div>
  );
}
