"use client";

import React, { useState, useEffect, ReactElement, useCallback } from "react";
import { FiCalendar, FiClock, FiUser, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { Employee, TimeOffRequest } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface EmployeeAvailabilityData {
  employee: Employee;
  assignments: Array<{
    id: string;
    event_id: string;
    start_date: string;
    end_date: string;
    status: string;
    events: {
      id: string;
      title: string;
      start_date: string;
      end_date: string;
    };
  }>;
  timeOffRequests: TimeOffRequest[];
  isAvailable: boolean;
  availabilityReason: string;
}

export default function EmployeeAvailabilityReport(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [employees, setEmployees] = useState<EmployeeAvailabilityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current week's Monday as default
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    setSelectedWeek(monday.toISOString().split("T")[0]);
  }, []);

  const fetchEmployeeAvailability = useCallback(async () => {
    if (!selectedWeek) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all employees
      const allEmployees = await employeesApi.getAllEmployees();

      // Sort employees alphabetically by first name, then last name
      const sortedEmployees = allEmployees.sort((a, b) => {
        const nameA =
          `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const nameB =
          `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Calculate week start and end dates
      const weekStart = new Date(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const employeeData: EmployeeAvailabilityData[] = [];

      for (const employee of sortedEmployees) {
        // Get assignments for this week
        const assignments = await assignmentsApi.getAssignmentsByEmployeeId(
          employee.employee_id
        );
        const weekAssignments = assignments.filter((assignment) => {
          const assignmentStart = new Date(assignment.start_date);
          const assignmentEnd = new Date(assignment.end_date);
          return assignmentStart <= weekEnd && assignmentEnd >= weekStart;
        });

        // Map assignments to include required fields (status and events)
        const weekAssignmentsEnriched = weekAssignments.map((a) => ({
          id: a.id,
          event_id: a.event_id,
          start_date: a.start_date,
          end_date: a.end_date,
          status: (a as { status?: string }).status || "Scheduled",
          events: {
            id: a.event_id,
            title:
              a.events?.title ??
              `Event ${a.event_id?.slice(0, 8) || "Unknown"}`,
            start_date: a.start_date,
            end_date: a.end_date,
          },
        }));

        // Get time off requests for this week
        const timeOffRequests =
          await timeOffRequestsApi.getTimeOffRequestsByEmployeeId(
            employee.employee_id
          );
        const weekTimeOffRequests = timeOffRequests.filter((request) => {
          const requestStart = new Date(request.start_datetime);
          const requestEnd = new Date(request.end_datetime);
          return requestStart <= weekEnd && requestEnd >= weekStart;
        });

        // Check if employee is available (no conflicts)
        const hasConflicts =
          weekAssignments.length > 0 || weekTimeOffRequests.length > 0;
        let availabilityReason = "";

        if (hasConflicts) {
          if (weekAssignments.length > 0) {
            availabilityReason = `Assigned to ${weekAssignments.length} event(s)`;
          } else if (weekTimeOffRequests.length > 0) {
            availabilityReason = `Has ${weekTimeOffRequests.length} time off request(s)`;
          }
        } else {
          availabilityReason = "Available";
        }

        employeeData.push({
          employee,
          assignments: weekAssignmentsEnriched,
          timeOffRequests: weekTimeOffRequests,
          isAvailable: !hasConflicts,
          availabilityReason,
        });
      }

      setEmployees(employeeData);
    } catch (err) {
      console.error("Error fetching employee availability:", err);
      setError("Failed to load employee availability data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (selectedWeek) {
      fetchEmployeeAvailability();
    }
  }, [selectedWeek, fetchEmployeeAvailability]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeekRange = () => {
    if (!selectedWeek) return "";
    const start = new Date(selectedWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
  };

  if (!isAdmin) {
    return (
      <div className="employee-availability-report">
        <h2 className="text-2xl text-primary-dark mb-4">
          Employee Availability Report
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-availability-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/reports"
            className="mr-4 text-primary-dark hover:text-primary-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">
            Employee Availability Report
          </h2>
        </div>
        <p className="text-gray-600">
          View employee assignments, time off requests, and availability for the
          selected week.
        </p>
      </div>

      {/* Week Selection */}
      <TutorialHighlight isHighlighted={shouldHighlight(".week-selector")}>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label
            htmlFor="week-selector"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Week (Monday)
          </label>
          <input
            type="date"
            id="week-selector"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="input-field"
          />
          {selectedWeek && (
            <p className="mt-2 text-sm text-gray-600">
              Week of: {getWeekRange()}
            </p>
          )}
        </div>
      </TutorialHighlight>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading employee data...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {employees.map((employeeData) => (
            <div
              key={employeeData.employee.employee_id}
              className="employee-card bg-white p-6 rounded shadow"
            >
              {/* Employee Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <FiUser className="text-gray-400 mr-3 text-lg" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {employeeData.employee.first_name}{" "}
                      {employeeData.employee.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {employeeData.employee.employee_type} •{" "}
                      {employeeData.employee.user_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      employeeData.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employeeData.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              {/* Availability Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> {employeeData.availabilityReason}
                </p>
              </div>

              {/* Assignments */}
              {employeeData.assignments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FiCalendar className="mr-2" />
                    Event Assignments
                  </h4>
                  <div className="space-y-2">
                    {employeeData.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-3 bg-blue-50 rounded border border-blue-200"
                      >
                        <p className="font-medium text-blue-800">
                          {assignment.events.title || "Untitled Event"}
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatDate(assignment.start_date)} -{" "}
                          {formatDate(assignment.end_date)}
                        </p>
                        <p className="text-xs text-blue-500">
                          Time: {formatTime(assignment.events.start_date)} -{" "}
                          {formatTime(assignment.events.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Off Requests */}
              {employeeData.timeOffRequests.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FiClock className="mr-2" />
                    Time Off Requests
                  </h4>
                  <div className="space-y-2">
                    {employeeData.timeOffRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-3 bg-yellow-50 rounded border border-yellow-200"
                      >
                        <p className="font-medium text-yellow-800">
                          {request.type} - {request.status}
                        </p>
                        <p className="text-sm text-yellow-600">
                          {formatDate(request.start_datetime)}{" "}
                          {formatTime(request.start_datetime)} -
                          {formatDate(request.end_datetime)}{" "}
                          {formatTime(request.end_datetime)}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-yellow-500 mt-1">
                            Reason: {request.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Conflicts Message */}
              {employeeData.assignments.length === 0 &&
                employeeData.timeOffRequests.length === 0 && (
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-700">
                      No conflicts or assignments for this week.
                    </p>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && employees.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total Employees:</span>
              <span className="ml-2 font-medium">{employees.length}</span>
            </div>
            <div>
              <span className="text-green-600">Available:</span>
              <span className="ml-2 font-medium">
                {employees.filter((e) => e.isAvailable).length}
              </span>
            </div>
            <div>
              <span className="text-red-600">Unavailable:</span>
              <span className="ml-2 font-medium">
                {employees.filter((e) => !e.isAvailable).length}
              </span>
            </div>
            <div>
              <span className="text-blue-600">With Assignments:</span>
              <span className="ml-2 font-medium">
                {employees.filter((e) => e.assignments.length > 0).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
