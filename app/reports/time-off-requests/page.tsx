"use client";

import React, { useState, useEffect, ReactElement, useCallback } from "react";
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiClock,
  FiCheck,
  FiX,
  FiFilter,
} from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { TimeOffRequest } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface TimeOffRequestWithEmployee extends TimeOffRequest {
  employees: {
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    employee_type: string | null;
  } | null;
}

export default function TimeOffRequestsReport(): ReactElement {
  const [timeOffRequests, setTimeOffRequests] = useState<
    TimeOffRequestWithEmployee[]
  >([]);
  const [employees, setEmployees] = useState<
    Array<{
      employee_id: string;
      first_name: string | null;
      last_name: string | null;
      user_email: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const supabase = createClient();

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id, first_name, last_name, user_email")
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching employees:", error);
        return;
      }

      setEmployees(data || []);
    } catch (err) {
      console.error("Error:", err);
    }
  }, [supabase]);

  const fetchTimeOffRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("time_off_request")
        .select(
          `
          *,
          employees (
            first_name,
            last_name,
            user_email,
            employee_type
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching time off requests:", error);
        setError("Failed to load time off requests");
        return;
      }

      setTimeOffRequests(data || []);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEmployees();
    fetchTimeOffRequests();
  }, [fetchEmployees, fetchTimeOffRequests]);

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("time_off_request")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating request:", error);
        setError("Failed to update request status");
        return;
      }

      // Refresh the data
      fetchTimeOffRequests();
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString: string) => {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600";
      case "denied":
        return "text-red-600";
      case "pending":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "vacation":
        return "text-blue-600";
      case "sick":
        return "text-red-600";
      case "personal":
        return "text-purple-600";
      case "bereavement":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const calculateTotalDays = (requests: TimeOffRequestWithEmployee[]) => {
    return requests.reduce((total, request) => {
      const start = new Date(request.start_datetime);
      const end = new Date(request.end_datetime);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return total + diffDays;
    }, 0);
  };

  const filteredRequests = timeOffRequests.filter((request) => {
    const employeeMatch =
      employeeFilter === "all" || request.employee_id === employeeFilter;
    const statusMatch =
      statusFilter === "all" || request.status.toLowerCase() === statusFilter;
    const typeMatch =
      typeFilter === "all" || request.type?.toLowerCase() === typeFilter;

    let dateMatch = true;
    if (startDateFilter && endDateFilter) {
      const requestStart = new Date(request.start_datetime);
      const filterStart = new Date(startDateFilter);
      const filterEnd = new Date(endDateFilter);
      dateMatch = requestStart >= filterStart && requestStart <= filterEnd;
    }

    return employeeMatch && statusMatch && typeMatch && dateMatch;
  });

  const clearAllFilters = () => {
    setEmployeeFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  if (!isAdmin) {
    return (
      <div className="time-off-requests-report">
        <h2 className="text-2xl text-primary-dark mb-4">
          Time Off Requests Report
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view this report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".time-off-requests-report")}
      className="time-off-requests-report"
    >
      <div className="time-off-requests-report">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/reports"
            className="inline-flex items-center text-primary-dark hover:text-primary-light mb-4 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Time Off Requests Report
          </Link>
          <h2 className="text-2xl text-primary-dark mb-2">
            Time Off Requests Report
          </h2>
          <p className="text-gray-600">
            View detailed time off requests for specific employees with
            filtering and status tracking.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}
                  >
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <option value="all">All Types</option>
                <option value="vacation">Vacation</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="bereavement">Bereavement</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  placeholder="yyyy-mm-dd"
                />
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  placeholder="yyyy-mm-dd"
                />
              </div>
            </div>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-primary-dark hover:text-primary-light text-sm underline"
          >
            Clear All Filters
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && filteredRequests.length > 0 && (
          <div className="bg-blue-50 p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRequests.length}
                </p>
                <p className="text-sm text-gray-600">Total Requests</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {
                    filteredRequests.filter((r) => r.status === "Approved")
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600">Accepted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {calculateTotalDays(filteredRequests)}
                </p>
                <p className="text-sm text-gray-600">Total Days</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {
                    filteredRequests.filter((r) => r.status === "Pending")
                      .length
                  }
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {filteredRequests.filter((r) => r.status === "Denied").length}
                </p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </div>
        )}

        {/* Time Off Requests List */}
        {!loading && (
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No time off requests found
                </h3>
                <p className="text-gray-500">
                  {employeeFilter !== "all" ||
                  statusFilter !== "all" ||
                  typeFilter !== "all" ||
                  startDateFilter ||
                  endDateFilter
                    ? "Try adjusting your filters to see more results."
                    : "There are currently no time off requests in the system."}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Employee Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FiUser className="text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.employees?.first_name}{" "}
                            {request.employees?.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {request.employees?.employee_type} •{" "}
                            {request.employees?.user_email}
                          </p>
                        </div>
                      </div>

                      {/* Request Type and Status */}
                      <div className="mb-3">
                        <span
                          className={`font-medium ${getTypeColor(request.type || "")}`}
                        >
                          {request.type || "N/A"}
                        </span>{" "}
                        <span
                          className={`font-medium ${getStatusColor(request.status)}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      {/* Date Range */}
                      <div className="flex items-center gap-3 mb-3">
                        <FiClock className="text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Start:</span>{" "}
                            {formatDateTime(request.start_datetime)}
                          </div>
                          <div>
                            <span className="font-medium">End:</span>{" "}
                            {formatDateTime(request.end_datetime)}
                          </div>
                        </div>
                      </div>

                      {/* Reason */}
                      {request.reason && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Reason</p>
                          <p className="text-sm text-gray-900 bg-yellow-50 p-3 rounded">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      {/* Created Date */}
                      <p className="text-xs text-gray-500">
                        Requested on {formatDate(request.created_at)}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {request.status === "Pending" && (
                      <div className="flex gap-2 lg:flex-col">
                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "Approved")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        >
                          <FiCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            updateRequestStatus(request.id, "Denied")
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          <FiX className="w-4 h-4" />
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </TutorialHighlight>
  );
}
