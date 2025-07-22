"use client";

import { useState, useEffect } from "react";
import { FiCalendar, FiClock } from "react-icons/fi";

import { useAuth } from "@/contexts/AuthContext";
import { Employee, TimeOffRequest } from "@/app/types";
import { employeesApi } from "@/lib/supabase/employees";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { createClient } from "@/lib/supabase/client";

interface ScheduleItem {
  truck_name: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  location: string;
}

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date = new Date()) {
  const start = getStartOfWeek(date);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        let employee = null;
        try {
          const employees = await employeesApi.getAllEmployees();
          employee = employees.find(
            (emp: Employee) =>
              emp.user_email?.toLowerCase() === user.email?.toLowerCase()
          );
          if (employee) {
            setEmployeeData(employee);
          } else {
          }
        } catch {}

        // Fetch assignments if we have an employee profile
        let assignments: Array<{
          id: string;
          employee_id: string;
          event_id: string;
          start_date: string;
          end_date: string;
        }> = [];
        if (employee?.employee_id) {
          try {
            assignments = await assignmentsApi.getAssignmentsByEmployeeId(
              employee.employee_id
            );
          } catch {}
        }

        // Get detailed event information for each assignment
        const scheduleItems: ScheduleItem[] = await Promise.all(
          assignments.map(async (assignment) => {
            try {
              const supabase = createClient();
              const { data } = await supabase
                .from("event_basic_info_view")
                .select("*")
                .eq("id", assignment.event_id)
                .single();

              return {
                truck_name: data?.title || "Event",
                shift_date: assignment.start_date,
                shift_start: new Date(assignment.start_date).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                shift_end: new Date(assignment.end_date).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                location: data?.addresses?.street || "Event Location",
              };
            } catch {
              return {
                truck_name: "Event",
                shift_date: assignment.start_date,
                shift_start: new Date(assignment.start_date).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                shift_end: new Date(assignment.end_date).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                location: "Event Location",
              };
            }
          })
        );

        // Filter to only show upcoming assignments
        const now = new Date();
        const upcomingItems = scheduleItems.filter(
          (item) => new Date(item.shift_date) >= now
        );

        setUpcomingSchedule(upcomingItems);

        // Fetch time-off requests
        let timeOffRequests: TimeOffRequest[] = [];

        if (employee?.employee_id) {
          try {
            timeOffRequests =
              await timeOffRequestsApi.getTimeOffRequestsByEmployeeId(
                employee.employee_id
              );
          } catch {}
        }

        setTimeOffRequests(timeOffRequests);
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getDisplayName = () => {
    if (employeeData) {
      return employeeData.first_name;
    }
    return user?.email?.split("@")[0] || "Employee";
  };

  const startOfWeek = getStartOfWeek();
  const endOfWeek = getEndOfWeek();

  const hoursThisWeek = upcomingSchedule.reduce((total, shift) => {
    const shiftDate = new Date(shift.shift_date);
    if (
      shiftDate >= startOfWeek &&
      shiftDate <= endOfWeek &&
      typeof shift.shift_start === "string" &&
      typeof shift.shift_end === "string"
    ) {
      const [startHour, startMinute] = shift.shift_start.split(":").map(Number);
      const [endHour, endMinute] = shift.shift_end.split(":").map(Number);

      if (
        !isNaN(startHour) &&
        !isNaN(startMinute) &&
        !isNaN(endHour) &&
        !isNaN(endMinute)
      ) {
        const start = new Date(shift.shift_date);
        const end = new Date(shift.shift_date);
        start.setHours(startHour, startMinute);
        end.setHours(endHour, endMinute);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
    }
    return total;
  }, 0);

  const maxHours = 40;
  const progress = hoursThisWeek / maxHours;

  let progressColor = "text-red-600";
  if (progress >= 0.75) {
    progressColor = "text-green-600";
  } else if (progress >= 0.4) {
    progressColor = "text-yellow-600";
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full p-8">
      <div className="w-full flex flex-col gap-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow p-10 flex items-center space-x-8">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
              {getDisplayName()?.charAt(0).toUpperCase() || "E"}
            </div>
          </div>
          <div className="flex-1 ">
            <h1 className="text-3xl  font-bold text-gray-900 mb-2">
              Welcome back, {getDisplayName()}!
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl shadow p-10 flex flex-col justify-center min-h-[200px]">
            <div className="flex items-center mb-6">
              <FiClock className={`h-12 w-12 ${progressColor}`} />
              <div className="ml-8">
                <p className="text-base font-medium text-gray-600 mb-2">
                  Hours This Week
                </p>
                <p className={`text-5xl font-bold ${progressColor}`}>
                  {hoursThisWeek.toFixed(1)}{" "}
                  <span className="text-gray-500 text-3xl">
                    / {maxHours} hrs
                  </span>
                </p>
              </div>
            </div>
            <div className="w-full ">
              <div
                className={`h-3 rounded-full ${progress >= 0.75 ? "bg-green-500" : progress >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-r from-green-100 to-green-50 rounded-xl shadow p-10 flex items-center min-h-[200px]">
            <FiClock className="h-10 w-10 text-green-600" />
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-600">
                Time-Off Requests
              </p>
              <p className="text-4xl font-bold text-gray-900">
                {timeOffRequests.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-10">
            <div className="flex items-center mb-8">
              <FiCalendar className="mr-3 text-blue-600 text-2xl" />
              <h2 className="text-xl font-semibold text-gray-900">
                Upcoming Schedule
              </h2>
              <div className="flex-1 border-t border-gray-200 ml-6" />
            </div>

            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500 text-lg">
                    Loading schedule...
                  </span>
                </div>
              ) : upcomingSchedule.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {upcomingSchedule.map((shift, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow duration-200"
                    >
                      <h3 className="font-medium text-gray-900 mb-3 text-lg">
                        {shift.truck_name}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiCalendar className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <p className="text-gray-500 font-medium text-lg">
                    No upcoming shifts
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check back later for new assignments
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Time-Off Requests  */}
          <div className="bg-white rounded-xl shadow-sm p-10">
            <div className="flex items-center mb-8">
              <FiClock className="mr-3 text-green-600 text-2xl" />
              <h2 className="text-xl font-semibold text-gray-900">
                My Time-Off Requests
              </h2>
              <div className="flex-1 border-t border-gray-200 ml-6" />
            </div>

            <div className="space-y-6">
              {timeOffRequests.length > 0 ? (
                timeOffRequests.map((req, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {new Date(req.start_datetime).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span>{" "}
                        {req.reason || "No reason provided"}
                      </p>
                      <div className="flex items-center">
                        <span className="font-medium text-sm mr-3">
                          Status:
                        </span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                <div className="text-center py-12">
                  <FiClock className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                  <p className="text-gray-500 font-medium text-lg">
                    No time-off requests
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Submit a request when you need time off
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
