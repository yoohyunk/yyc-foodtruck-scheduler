"use client";

import { useState, useEffect } from "react";
import { FiCalendar, FiClock } from "react-icons/fi";

import { useAuth } from "@/contexts/AuthContext";
import { Employee, TimeOffRequest } from "@/app/types";
import { employeesApi } from "@/lib/supabase/employees";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { Tables } from "@/database.types";

interface ScheduleItem {
  truck_name: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  location: string;
}

type Assignment = Tables<"assignments">;

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.id) return;

      try {
        // Get employee data using the user's email
        const employees = await employeesApi.getAllEmployees();
        const employee = employees.find(
          (emp: Employee) => emp.user_email === user.email
        );

        if (employee) {
          setEmployeeData(employee);
        } else {
          setError("Employee profile not found");
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
        setError("Failed to load employee data");
      }
    };

    const fetchSchedule = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        // Get assignments for the employee
        const assignments = await assignmentsApi.getAssignmentsByEmployeeId(
          user.id
        );

        // Transform assignments into schedule items
        const scheduleItems: ScheduleItem[] = assignments.map(
          (assignment: Assignment) => ({
            truck_name: "Assigned Event", // You might want to join with events table
            shift_date: assignment.start_date,
            shift_start: new Date(assignment.start_date).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
            shift_end: new Date(assignment.end_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            location: "Event Location", // You might want to join with events table
          })
        );

        setUpcomingSchedule(scheduleItems);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError("Failed to load schedule");
        setUpcomingSchedule([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchTimeOffRequests = async () => {
      if (!user?.id) return;

      try {
        const requests =
          await timeOffRequestsApi.getTimeOffRequestsByEmployeeId(user.id);
        setTimeOffRequests(requests);
      } catch (err) {
        console.error("Error fetching time off requests:", err);
        setError("Failed to load time off requests");
        setTimeOffRequests([]);
      }
    };

    fetchEmployeeData();
    fetchSchedule();
    fetchTimeOffRequests();
  }, [user]);

  const getDisplayName = () => {
    if (employeeData) {
      return employeeData.first_name;
    }
    return user?.email?.split("@")[0] || "Employee";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {getDisplayName()}!
        </h1>
        <p className="text-gray-600">
          Here&apos;s your dashboard overview for today.
        </p>

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedule */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiCalendar className="mr-2 text-blue-600" />
              Upcoming Schedule
            </h2>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">Loading schedule...</span>
              </div>
            ) : upcomingSchedule.length > 0 ? (
              upcomingSchedule.map((shift, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {shift.truck_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(shift.shift_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{" "}
                      {shift.shift_start} – {shift.shift_end}
                    </p>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {shift.location}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">No upcoming shifts</p>
                <p className="text-sm text-gray-400 mt-1">
                  Check back later for new assignments
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Time-Off Requests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiClock className="mr-2 text-green-600" />
              My Time-Off Requests
            </h2>
          </div>

          <div className="space-y-4">
            {timeOffRequests.length > 0 ? (
              timeOffRequests.map((req, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(req.start_datetime).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span>{" "}
                      {req.reason || "No reason provided"}
                    </p>
                    <div className="flex items-center">
                      <span className="font-medium text-sm mr-2">Status:</span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          req.status === "Accepted"
                            ? "bg-green-100 text-green-800"
                            : req.status === "Declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 font-medium">
                  No time-off requests
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Submit a request when you need time off
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiCalendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Upcoming Shifts
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingSchedule.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiClock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Time-Off Requests
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {timeOffRequests.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
