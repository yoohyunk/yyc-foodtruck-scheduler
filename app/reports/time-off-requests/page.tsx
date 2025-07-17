"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { FiCalendar, FiUser, FiArrowLeft, FiFilter } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { employeesApi } from "@/lib/supabase/employees";
import { TimeOffRequest, Employee } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface TimeOffRequestWithEmployee extends TimeOffRequest {
  employee: Employee;
}

export default function TimeOffRequestsReport(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [requests, setRequests] = useState<TimeOffRequestWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all time off requests
        const allRequests = await timeOffRequestsApi.getAllTimeOffRequests();
        
        // Fetch all employees
        const allEmployees = await employeesApi.getAllEmployees();
        
        // Sort employees alphabetically by first name, then last name
        const sortedEmployees = allEmployees.sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setEmployees(sortedEmployees);

        // Combine requests with employee data
        const requestsWithEmployees: TimeOffRequestWithEmployee[] = allRequests.map(request => {
          const employee = allEmployees.find(emp => emp.employee_id === request.employee_id);
          return {
            ...request,
            employee: employee || ({
              employee_id: request.employee_id || "",
              first_name: "Unknown",
              last_name: "Employee",
              employee_type: "Unknown",
              user_email: "unknown@example.com",
              user_phone: "",
              is_available: true,
              is_pending: false,
              created_at: "",
              address_id: null,
              availability: null,
              user_id: null,
            } as any),
          };
        });

        setRequests(requestsWithEmployees);
      } catch (err) {
        console.error("Error fetching time off requests:", err);
        setError("Failed to load time off requests data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRequests = requests.filter(request => {
    // Employee filter
    if (selectedEmployee && request.employee_id !== selectedEmployee) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "All" && request.status !== selectedStatus) {
      return false;
    }

    // Type filter
    if (selectedType !== "All" && request.type !== selectedType) {
      return false;
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      const requestStart = new Date(request.start_datetime);
      
      if (dateRange.start) {
        const filterStart = new Date(dateRange.start);
        if (requestStart < filterStart) return false;
      }
      
      if (dateRange.end) {
        const filterEnd = new Date(dateRange.end);
        if (requestStart > filterEnd) return false;
      }
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Vacation":
        return "bg-blue-100 text-blue-800";
      case "Sick Leave":
        return "bg-red-100 text-red-800";
      case "Personal Leave":
        return "bg-purple-100 text-purple-800";
      case "Emergency":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => r.status === "Pending").length;
    const accepted = filteredRequests.filter(r => r.status === "Accepted").length;
    const rejected = filteredRequests.filter(r => r.status === "Rejected").length;
    const totalDays = filteredRequests.reduce((sum, r) => sum + calculateDuration(r.start_datetime, r.end_datetime), 0);
    
    return { total, pending, accepted, rejected, totalDays };
  };

  if (!isAdmin) {
    return (
      <div className="time-off-requests-report">
        <h2 className="text-2xl text-primary-dark mb-4">Time Off Requests Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  const { total, pending, accepted, rejected, totalDays } = calculateStats();

  return (
    <div className="time-off-requests-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link href="/reports" className="mr-4 text-primary-dark hover:text-primary-medium">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">Time Off Requests Report</h2>
        </div>
        <p className="text-gray-600">
          View detailed time off requests for specific employees with filtering and status tracking.
        </p>
      </div>

      {/* Filters */}
      <TutorialHighlight isHighlighted={shouldHighlight(".filters-section")}>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <FiFilter className="mr-2" />
            Filters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employee Filter */}
            <div>
              <label htmlFor="employee-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Employee
              </label>
              <select
                id="employee-filter"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input-field"
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id} value={employee.employee_id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
              >
                <option value="All">All Types</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal Leave">Personal Leave</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label htmlFor="date-start" className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  id="date-start"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="Start"
                />
                <input
                  type="date"
                  id="date-end"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input-field text-sm"
                  placeholder="End"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                setSelectedEmployee("");
                setSelectedStatus("All");
                setSelectedType("All");
                setDateRange({ start: "", end: "" });
              }}
              className="text-sm text-primary-dark hover:text-primary-medium underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </TutorialHighlight>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total Requests:</span>
              <span className="ml-2 font-medium">{total}</span>
            </div>
            <div>
              <span className="text-yellow-600">Pending:</span>
              <span className="ml-2 font-medium">{pending}</span>
            </div>
            <div>
              <span className="text-green-600">Accepted:</span>
              <span className="ml-2 font-medium">{accepted}</span>
            </div>
            <div>
              <span className="text-red-600">Rejected:</span>
              <span className="ml-2 font-medium">{rejected}</span>
            </div>
            <div>
              <span className="text-blue-600">Total Days:</span>
              <span className="ml-2 font-medium">{totalDays}</span>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading time off requests...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.length > 0 ? (
            filteredRequests
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((request) => (
              <div key={request.id} className="employee-card bg-white p-6 rounded shadow">
                {/* Request Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <FiUser className="text-gray-400 mr-3 text-lg" />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {request.employee.first_name} {request.employee.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.employee.employee_type} • {request.employee.user_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(request.type)}`}>
                      {request.type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FiCalendar className="text-blue-500 mr-2" />
                      <span className="font-medium text-gray-700">Start Date & Time</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(request.start_datetime)} {formatTime(request.start_datetime)}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FiCalendar className="text-blue-500 mr-2" />
                      <span className="font-medium text-gray-700">End Date & Time</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(request.end_datetime)} {formatTime(request.end_datetime)}
                    </span>
                  </div>
                </div>

                {/* Reason */}
                {request.reason && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Duration: {calculateDuration(request.start_datetime, request.end_datetime)} day(s)
                    </span>
                    <span>
                      Requested on: {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No time off requests found matching the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 