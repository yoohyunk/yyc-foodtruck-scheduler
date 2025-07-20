"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { FiCalendar, FiUser, FiArrowLeft, FiFilter } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { employeesApi } from "@/lib/supabase/employees";
import { eventsApi } from "@/lib/supabase/events";
import { Employee } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface AssignmentWithEmployee {
  id: string;
  employee_id: string | null;
  event_id: string | null;
  start_date: string;
  end_date: string;
  is_completed: boolean | null;
  status: string | null;
  created_at: string;
  employee: Employee;
  events?: {
    id: string;
    title: string | null;
    start_date: string;
    end_date: string;
  } | null;
  assignment_type: "server" | "driver" | "standalone";
}

interface DriverAssignmentWithEmployee {
  id: string;
  driver_id: string | null;
  event_id: string | null;
  start_time: string;
  end_time: string;
  created_at: string;
  truck_id: string | null;
  employee: Employee;
  events?: {
    id: string;
    title: string | null;
    start_date: string;
    end_date: string;
  } | null;
  assignment_type: "driver";
  status?: string | null; // Add status property for consistency
  is_completed?: boolean | null; // Add is_completed property for consistency
}

export default function AssignmentReport(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [assignments, setAssignments] = useState<AssignmentWithEmployee[]>([]);
  const [driverAssignments, setDriverAssignments] = useState<
    DriverAssignmentWithEmployee[]
  >([]);
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
        // Fetch all employees
        const allEmployees = await employeesApi.getAllEmployees();

        // Sort employees alphabetically by first name, then last name
        const sortedEmployees = allEmployees.sort((a, b) => {
          const nameA =
            `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
          const nameB =
            `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setEmployees(sortedEmployees);

        // Fetch all assignments
        const allAssignments = await assignmentsApi.getAllAssignments();

        // Fetch all driver assignments
        const allDriverAssignments =
          await assignmentsApi.getAllTruckAssignments();

        // Combine assignments with employee data
        const assignmentsWithEmployees: AssignmentWithEmployee[] =
          allAssignments.map((assignment) => {
            const employee = allEmployees.find(
              (emp) => emp.employee_id === assignment.employee_id
            );
            return {
              ...assignment,
              employee:
                employee ||
                ({
                  employee_id: assignment.employee_id || "",
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
                } as Employee),
              assignment_type: assignment.event_id
                ? "server"
                : ("standalone" as const),
            };
          });

        // Combine driver assignments with employee data
        const driverAssignmentsWithEmployees: DriverAssignmentWithEmployee[] =
          allDriverAssignments.map((assignment) => {
            const employee = allEmployees.find(
              (emp) => emp.employee_id === assignment.driver_id
            );
            return {
              ...assignment,
              employee:
                employee ||
                ({
                  employee_id: assignment.driver_id || "",
                  first_name: "Unknown",
                  last_name: "Driver",
                  employee_type: "Driver",
                  user_email: "unknown@example.com",
                  user_phone: "",
                  is_available: true,
                  is_pending: false,
                  created_at: "",
                  address_id: null,
                  availability: null,
                  user_id: null,
                } as Employee),
              assignment_type: "driver" as const,
            };
          });

        // Fetch event details for assignments
        for (const assignment of assignmentsWithEmployees) {
          if (assignment.event_id) {
            try {
              const eventDetails = await eventsApi.getEventById(
                assignment.event_id
              );
              assignment.events = eventDetails;
            } catch (error) {
              console.warn(
                `Failed to fetch event details for ${assignment.event_id}:`,
                error
              );
              assignment.events = null;
            }
          }
        }

        // Fetch event details for driver assignments
        for (const assignment of driverAssignmentsWithEmployees) {
          if (assignment.event_id) {
            try {
              const eventDetails = await eventsApi.getEventById(
                assignment.event_id
              );
              assignment.events = eventDetails;
            } catch (error) {
              console.warn(
                `Failed to fetch event details for ${assignment.event_id}:`,
                error
              );
              assignment.events = null;
            }
          }
        }

        setAssignments(assignmentsWithEmployees);
        setDriverAssignments(driverAssignmentsWithEmployees);
      } catch (err) {
        console.error("Error fetching shifts:", err);
        setError("Failed to load shifts data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Combine all assignments for filtering
  const allShifts = [
    ...assignments,
    ...driverAssignments.map((driver) => ({
      ...driver,
      start_date: driver.start_time,
      end_date: driver.end_time,
      employee_id: driver.driver_id,
    })),
  ];

  const filteredShifts = allShifts.filter((shift) => {
    // Employee filter
    if (selectedEmployee && shift.employee_id !== selectedEmployee) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "All" && shift.status !== selectedStatus) {
      return false;
    }

    // Type filter
    if (selectedType !== "All" && shift.assignment_type !== selectedType) {
      return false;
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      const shiftStart = new Date(shift.start_date);

      if (dateRange.start) {
        const filterStart = new Date(dateRange.start);
        if (shiftStart < filterStart) return false;
      }

      if (dateRange.end) {
        const filterEnd = new Date(dateRange.end);
        if (shiftStart > filterEnd) return false;
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
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "server":
        return "bg-blue-100 text-blue-800";
      case "driver":
        return "bg-green-100 text-green-800";
      case "standalone":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateStats = () => {
    const total = filteredShifts.length;
    const serverShifts = filteredShifts.filter(
      (s) => s.assignment_type === "server"
    ).length;
    const driverShifts = filteredShifts.filter(
      (s) => s.assignment_type === "driver"
    ).length;
    const standaloneShifts = filteredShifts.filter(
      (s) => s.assignment_type === "standalone"
    ).length;
    const totalHours = filteredShifts.reduce(
      (sum, s) => sum + calculateDuration(s.start_date, s.end_date),
      0
    );

    return { total, serverShifts, driverShifts, standaloneShifts, totalHours };
  };

  if (!isAdmin) {
    return (
      <div className="assignment-report">
        <h2 className="text-2xl text-primary-dark mb-4">Assignment Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  const { total, serverShifts, driverShifts, standaloneShifts, totalHours } =
    calculateStats();

  return (
    <div className="assignment-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/reports"
            className="mr-4 text-primary-dark hover:text-primary-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">Assignment Report</h2>
        </div>
        <p className="text-gray-600">
          View detailed assignment information for all employees including
          server assignments, driver assignments, and standalone shifts.
        </p>
      </div>

      {/* Filters */}
      <TutorialHighlight isHighlighted={shouldHighlight(".filters-section")}>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <FiFilter className="mr-2" />
            Filters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Employee Filter */}
            <div>
              <label
                htmlFor="employee-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}
                  >
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label
                htmlFor="status-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label
                htmlFor="type-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Shift Type
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
              >
                <option value="All">All Types</option>
                <option value="server">Server Shifts</option>
                <option value="driver">Driver Shifts</option>
                <option value="standalone">Standalone Shifts</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label
                htmlFor="date-start"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  id="date-start"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="input-field text-sm"
                  placeholder="Start"
                />
                <input
                  type="date"
                  id="date-end"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total Assignments:</span>
              <span className="ml-2 font-medium">{total}</span>
            </div>
            <div>
              <span className="text-blue-600">Server Assignments:</span>
              <span className="ml-2 font-medium">{serverShifts}</span>
            </div>
            <div>
              <span className="text-green-600">Driver Assignments:</span>
              <span className="ml-2 font-medium">{driverShifts}</span>
            </div>
            <div>
              <span className="text-purple-600">Standalone Assignments:</span>
              <span className="ml-2 font-medium">{standaloneShifts}</span>
            </div>
            <div>
              <span className="text-blue-600">Total Hours:</span>
              <span className="ml-2 font-medium">{totalHours}</span>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading shifts...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredShifts.length > 0 ? (
            filteredShifts
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )
              .map((shift) => (
                <div
                  key={shift.id}
                  className="employee-card bg-white p-6 rounded shadow"
                >
                  {/* Shift Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <FiUser className="text-gray-400 mr-3 text-lg" />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">
                          {shift.employee.first_name} {shift.employee.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {shift.employee.employee_type} •{" "}
                          {shift.employee.user_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(shift.assignment_type)}`}
                      >
                        {shift.assignment_type === "server"
                          ? "Server"
                          : shift.assignment_type === "driver"
                            ? "Driver"
                            : "Standalone"}
                      </span>
                      {shift.status && (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shift.status)}`}
                        >
                          {shift.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shift Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <FiCalendar className="text-blue-500 mr-2" />
                        <span className="font-medium text-gray-700">
                          Start Date & Time
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {formatDate(shift.start_date)}{" "}
                        {formatTime(shift.start_date)}
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
                        {formatDate(shift.end_date)}{" "}
                        {formatTime(shift.end_date)}
                      </span>
                    </div>
                  </div>

                  {/* Event Information */}
                  {shift.events && (
                    <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>Event:</strong>{" "}
                        {shift.events.title || "Untitled Event"}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Event ID: {shift.events.id}
                      </p>
                    </div>
                  )}

                  {/* Standalone Shift Note */}
                  {shift.assignment_type === "standalone" && (
                    <div className="mb-4 p-3 bg-purple-50 rounded border border-purple-200">
                      <p className="text-sm text-purple-800">
                        <strong>Standalone Shift:</strong> This shift is not
                        linked to any specific event.
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Duration:{" "}
                        {calculateDuration(shift.start_date, shift.end_date)}{" "}
                        hour(s)
                      </span>
                      <span>Created on: {formatDate(shift.created_at)}</span>
                    </div>
                    {shift.is_completed !== null && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span>
                          Completed: {shift.is_completed ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No shifts found matching the selected filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
