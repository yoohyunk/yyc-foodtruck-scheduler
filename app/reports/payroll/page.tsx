"use client";

import React, { useState, useEffect, ReactElement, useCallback } from "react";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import taxCalculations from "./taxCalculations.json";

import Holidays from "date-holidays";

interface PayrollData {
  employee: Employee;
  currentWage: number;
  totalHours: number;
  totalEvents: number;
  grossPay: number;
  netPay: number;
  taxDeductions: {
    federalTax: number;
    provincialTax: number;
    cppContribution: number;
    eiPremium: number;
    totalDeductions: number;
  };
  assignments: Array<{
    id: string;
    start_date: string;
    end_date: string;
    events: {
      title: string | null;
    };
    isHoliday: boolean;
  }>;
  shiftDetails: Array<{
    type: string;
    title: string;
    start: Date;
    end: Date;
    hours: number;
  }>;
}

// Tax calculation functions
const calculateFederalTax = (annualIncome: number): number => {
  let totalTax = 0;

  for (const bracket of taxCalculations.federal_brackets) {
    const bracketStart = bracket.from;
    const bracketEnd = bracket.to || Infinity;
    const rate = bracket.rate;

    if (annualIncome > bracketStart) {
      const taxableInBracket =
        Math.min(annualIncome, bracketEnd) - bracketStart;
      totalTax += taxableInBracket * rate;
    }
  }

  return totalTax;
};

const calculateProvincialTax = (annualIncome: number): number => {
  let totalTax = 0;

  for (const bracket of taxCalculations.provincial_brackets) {
    const bracketStart = bracket.from;
    const bracketEnd = bracket.to || Infinity;
    const rate = bracket.rate;

    if (annualIncome > bracketStart) {
      const taxableInBracket =
        Math.min(annualIncome, bracketEnd) - bracketStart;
      totalTax += taxableInBracket * rate;
    }
  }

  return totalTax;
};

const calculateCPPContribution = (annualIncome: number): number => {
  const exemption = taxCalculations.cpp_contribution.exemption;
  const maxContribution = taxCalculations.cpp_contribution.max_contribution;
  const rate = taxCalculations.cpp_contribution.rate;

  const contributableIncome = Math.max(0, annualIncome - exemption);
  const contribution = Math.min(contributableIncome, maxContribution) * rate;

  return contribution;
};

const calculateEIPremium = (annualIncome: number): number => {
  const maxContribution = taxCalculations.ei_premium.max_contribution;
  const rate = taxCalculations.ei_premium.rate;

  const premium = Math.min(annualIncome, maxContribution) * rate;

  return premium;
};

const calculateNetPay = (
  grossPay: number,
  payPeriodsPerYear: number = 26
): number => {
  // Convert to annual income (assuming bi-weekly pay periods)
  const annualIncome = grossPay * payPeriodsPerYear;

  // Calculate all deductions
  const federalTax = calculateFederalTax(annualIncome);
  const provincialTax = calculateProvincialTax(annualIncome);
  const cppContribution = calculateCPPContribution(annualIncome);
  const eiPremium = calculateEIPremium(annualIncome);

  // Convert annual deductions back to pay period
  const federalTaxPerPeriod = federalTax / payPeriodsPerYear;
  const provincialTaxPerPeriod = provincialTax / payPeriodsPerYear;
  const cppPerPeriod = cppContribution / payPeriodsPerYear;
  const eiPerPeriod = eiPremium / payPeriodsPerYear;

  const totalDeductions =
    federalTaxPerPeriod + provincialTaxPerPeriod + cppPerPeriod + eiPerPeriod;
  const netPay = grossPay - totalDeductions;

  return Math.max(0, netPay); // Ensure net pay is not negative
};

const calculateTaxDeductions = (
  grossPay: number,
  payPeriodsPerYear: number = 26
) => {
  const annualIncome = grossPay * payPeriodsPerYear;

  const federalTax = calculateFederalTax(annualIncome);
  const provincialTax = calculateProvincialTax(annualIncome);
  const cppContribution = calculateCPPContribution(annualIncome);
  const eiPremium = calculateEIPremium(annualIncome);

  const federalTaxPerPeriod = federalTax / payPeriodsPerYear;
  const provincialTaxPerPeriod = provincialTax / payPeriodsPerYear;
  const cppPerPeriod = cppContribution / payPeriodsPerYear;
  const eiPerPeriod = eiPremium / payPeriodsPerYear;

  const totalDeductions =
    federalTaxPerPeriod + provincialTaxPerPeriod + cppPerPeriod + eiPerPeriod;

  return {
    federalTax: federalTaxPerPeriod,
    provincialTax: provincialTaxPerPeriod,
    cppContribution: cppPerPeriod,
    eiPremium: eiPerPeriod,
    totalDeductions,
  };
};

// Add a helper to check if a date is a stat holiday in Alberta
const hd = new Holidays();
hd.init("CA", "AB");
const isStatHoliday = (date: Date) => {
  return !!hd.isHoliday(date);
};

export default function PayrollReport(): ReactElement {
  const { isAdmin, user } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [payPeriod, setPayPeriod] = useState<{
    start: string;
    end: string;
    label: string;
  }>({ start: "", end: "", label: "" });
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Calculate pay period based on selected date
  const calculatePayPeriod = useCallback((dateStr: string) => {
    if (!dateStr) return { start: "", end: "", label: "" };

    // Helper to get last day of month (defined inside useCallback to avoid dependency issues)
    const getLastDayOfMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    let start, end, label;
    if (day <= 15) {
      start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      end = `${year}-${String(month + 1).padStart(2, "0")}-15`;
      label = `${date.toLocaleString("en-US", { month: "short" })} 1–15, ${year}`;
    } else {
      const lastDay = getLastDayOfMonth(year, month);
      start = `${year}-${String(month + 1).padStart(2, "0")}-16`;
      end = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;
      label = `${date.toLocaleString("en-US", { month: "short" })} 16–${lastDay}, ${year}`;
    }
    return { start, end, label };
  }, []);

  // Set default date to today on mount
  useEffect(() => {
    const today = new Date();
    const iso = today.toISOString().split("T")[0];
    setSelectedDate(iso);
    setPayPeriod(calculatePayPeriod(iso));
  }, [calculatePayPeriod]);

  // Update pay period when date changes
  useEffect(() => {
    if (selectedDate) {
      setPayPeriod(calculatePayPeriod(selectedDate));
    }
  }, [selectedDate, calculatePayPeriod]);

  // Fetch payroll data for the current pay period
  const fetchPayrollData = useCallback(async () => {
    if (!payPeriod.start || !payPeriod.end) return;
    setIsLoading(true);
    setError(null);

    // Add timeout to prevent hanging requests
    const timeout = setTimeout(() => {
      setError("Request timed out. Please try again.");
      setIsLoading(false);
    }, 30000); // 30 second timeout

    try {
      let employeesToProcess: Employee[] = [];
      if (isAdmin) {
        const allEmployees = await employeesApi.getAllEmployees();
        employeesToProcess = allEmployees;
      } else {
        if (!user?.id) {
          setError("User not found.");
          return;
        }
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", user.id)
          .single();
        if (employeeError || !employee) {
          setError("Employee information not found.");
          return;
        }
        employeesToProcess = [employee];
      }

      // Sort employees alphabetically
      const sortedEmployees = employeesToProcess.sort((a, b) => {
        const nameA =
          `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const nameB =
          `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Bulk fetch all wages for all employees
      const employeeIds = sortedEmployees.map((emp) => emp.employee_id);
      const { data: allWages, error: wagesError } = await supabase
        .from("wage")
        .select("*")
        .in("employee_id", employeeIds)
        .order("start_date", { ascending: false });

      if (wagesError) {
        console.error("Error fetching wages:", wagesError);
        throw new Error("Failed to fetch wages");
      }

      // Create a map of current wages (most recent per employee)
      const wageMap = new Map<string, number>();
      if (allWages) {
        allWages.forEach((wage) => {
          if (!wageMap.has(wage.employee_id)) {
            wageMap.set(wage.employee_id, wage.hourly_wage);
          }
        });
      }

      // Bulk fetch all assignments for all employees
      const { data: allAssignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(
          `
          *,
          events (
            id,
            title,
            start_date,
            end_date
          )
        `
        )
        .in("employee_id", employeeIds);

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        throw new Error("Failed to fetch assignments");
      }

      // Bulk fetch all truck assignments for all employees
      const { data: allTruckAssignments, error: truckAssignmentsError } =
        await supabase
          .from("truck_assignment")
          .select("*")
          .in("driver_id", employeeIds);

      if (truckAssignmentsError) {
        console.error(
          "Error fetching truck assignments:",
          truckAssignmentsError
        );
        throw new Error("Failed to fetch truck assignments");
      }

      // Bulk fetch all events that might have employees working on them
      const { data: allEvents, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          id,
          title,
          start_date,
          end_date,
          number_of_servers_needed,
          number_of_driver_needed
        `
        )
        .gte("start_date", payPeriod.start)
        .lte("end_date", payPeriod.end);

      if (eventsError) {
        console.error("Error fetching events:", eventsError);
        throw new Error("Failed to fetch events");
      }

      const payrollDataArray: PayrollData[] = [];

      for (const employee of sortedEmployees) {
        const currentWage = wageMap.get(employee.employee_id) || 0;

        // Filter assignments for this employee and pay period
        const employeeAssignments =
          allAssignments?.filter(
            (assignment) => assignment.employee_id === employee.employee_id
          ) || [];

        const periodAssignments = employeeAssignments.filter((assignment) => {
          const assignmentStart = new Date(assignment.start_date);
          const assignmentEnd = new Date(assignment.end_date);
          const periodStart = new Date(payPeriod.start);
          const periodEnd = new Date(payPeriod.end);
          return assignmentStart <= periodEnd && assignmentEnd >= periodStart;
        });

        // Filter truck assignments for this employee and pay period
        const employeeTruckAssignments =
          allTruckAssignments?.filter(
            (assignment) => assignment.driver_id === employee.employee_id
          ) || [];

        const periodTruckAssignments = employeeTruckAssignments.filter(
          (assignment) => {
            const assignmentStart = new Date(assignment.start_time); // Fixed: use start_time instead of start_date
            const assignmentEnd = new Date(assignment.end_time); // Fixed: use end_time instead of end_date
            const periodStart = new Date(payPeriod.start);
            const periodEnd = new Date(payPeriod.end);
            return assignmentStart <= periodEnd && assignmentEnd >= periodStart;
          }
        );

        // Map assignments to include required fields (events)
        const periodAssignmentsEnriched = periodAssignments.map((a) => ({
          id: a.id,
          start_date: a.start_date,
          end_date: a.end_date,
          events: {
            title: Array.isArray(a.events)
              ? a.events[0]?.title || "Untitled Event"
              : a.events?.title || "Untitled Event",
          },
          isHoliday: isStatHoliday(new Date(a.start_date)),
        }));

        // Map truck assignments to include required fields
        const periodTruckAssignmentsEnriched = periodTruckAssignments.map(
          (a) => ({
            id: a.id,
            start_date: a.start_time, // Map start_time to start_date for consistency
            end_date: a.end_time, // Map end_time to end_date for consistency
            events: {
              title: "Truck Assignment",
            },
            isHoliday: isStatHoliday(new Date(a.start_time)),
          })
        );

        // Combine all assignments for hours calculation
        const combinedAssignments = [
          ...periodAssignments,
          ...periodTruckAssignments,
        ];
        const allAssignmentsEnriched = [
          ...periodAssignmentsEnriched,
          ...periodTruckAssignmentsEnriched,
        ];

        let totalHours = 0;
        const shiftDetails: Array<{
          type: string;
          title: string;
          start: Date;
          end: Date;
          hours: number;
        }> = [];

        // Calculate hours from assignments
        for (const assignment of combinedAssignments) {
          try {
            const start = new Date(
              assignment.start_date || assignment.start_time
            );
            const end = new Date(assignment.end_date || assignment.end_time);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              console.warn(
                `Invalid date for assignment ${assignment.id}:`,
                assignment
              );
              continue;
            }

            const diffTime = end.getTime() - start.getTime();
            const diffHours = diffTime / (1000 * 60 * 60);

            if (diffHours > 0) {
              totalHours += diffHours;
              shiftDetails.push({
                type: assignment.start_time
                  ? "Truck Assignment"
                  : "Event Assignment",
                title: Array.isArray(assignment.events)
                  ? assignment.events[0]?.title || "Untitled Event"
                  : assignment.events?.title || "Untitled Event",
                start,
                end,
                hours: diffHours,
              });
            }
          } catch (error) {
            console.error(
              `Error calculating hours for assignment ${assignment.id}:`,
              error
            );
          }
        }

        // Calculate hours from events where employee might have worked but no explicit assignment
        // This is a fallback for events that might not have assignments recorded
        if (allEvents) {
          for (const event of allEvents) {
            try {
              const eventStart = new Date(event.start_date);
              const eventEnd = new Date(event.end_date);

              if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
                console.warn(`Invalid date for event ${event.id}:`, event);
                continue;
              }

              // Check if this employee type could have worked this event
              const couldHaveWorked =
                (employee.employee_type === "Server" &&
                  event.number_of_servers_needed &&
                  event.number_of_servers_needed > 0) ||
                (employee.employee_type === "Driver" &&
                  event.number_of_driver_needed &&
                  event.number_of_driver_needed > 0) ||
                employee.employee_type === "Manager";

              if (couldHaveWorked) {
                const diffTime = eventEnd.getTime() - eventStart.getTime();
                const diffHours = diffTime / (1000 * 60 * 60);

                // Only add if no explicit assignment exists for this event
                const hasExplicitAssignment = allAssignments.some(
                  (assignment) => assignment.event_id === event.id
                );

                if (!hasExplicitAssignment && diffHours > 0) {
                  totalHours += diffHours;
                  shiftDetails.push({
                    type: "Event (No Assignment)",
                    title: event.title || "Untitled Event",
                    start: eventStart,
                    end: eventEnd,
                    hours: diffHours,
                  });
                }
              }
            } catch (error) {
              console.error(
                `Error calculating hours for event ${event.id}:`,
                error
              );
            }
          }
        }

        const wage =
          typeof currentWage === "number" && !isNaN(currentWage)
            ? currentWage
            : 0;
        const grossPay = totalHours * wage;
        const taxDeductions = calculateTaxDeductions(grossPay);
        const netPay = calculateNetPay(grossPay);

        payrollDataArray.push({
          employee,
          currentWage: wage,
          totalHours,
          totalEvents: allAssignments.length,
          grossPay,
          netPay,
          taxDeductions,
          assignments: allAssignmentsEnriched,
          shiftDetails,
        });
      }

      const filteredData = isAdmin
        ? payrollDataArray.filter((data) => data.totalHours > 0)
        : payrollDataArray;
      setPayrollData(filteredData);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      setError("Failed to load payroll data. Please try again.");
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [payPeriod, isAdmin, user?.id, supabase]);

  useEffect(() => {
    if (payPeriod.start && payPeriod.end) {
      fetchPayrollData();
    }
  }, [payPeriod, fetchPayrollData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const calculateTotals = () => {
    const totalHours = payrollData.reduce(
      (sum, data) => sum + data.totalHours,
      0
    );
    const totalGrossPay = payrollData.reduce(
      (sum, data) => sum + data.grossPay,
      0
    );
    const totalNetPay = payrollData.reduce((sum, data) => sum + data.netPay, 0);
    const totalDeductions = payrollData.reduce(
      (sum, data) => sum + data.taxDeductions.totalDeductions,
      0
    );
    const totalEvents = payrollData.reduce(
      (sum, data) => sum + data.totalEvents,
      0
    );
    const totalEmployees = payrollData.length;

    // Calculate hours by shift type
    const hoursByShiftType = payrollData.reduce(
      (acc, data) => {
        data.shiftDetails.forEach((shift) => {
          acc[shift.type] = (acc[shift.type] || 0) + shift.hours;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalHours,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      totalEvents,
      totalEmployees,
      hoursByShiftType,
    };
  };

  if (!isAdmin && !user) {
    return (
      <div className="payroll-report">
        <h2 className="text-2xl text-primary-dark mb-4">Payroll Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Please log in to view your payroll information.
          </p>
        </div>
      </div>
    );
  }

  const {
    totalHours,
    totalGrossPay,
    totalNetPay,
    totalDeductions,
    totalEvents,
    totalEmployees,
    hoursByShiftType,
  } = calculateTotals();

  return (
    <div className="payroll-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/reports"
            className="mr-4 text-primary-dark hover:text-primary-medium"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">Payroll Report</h2>
        </div>
        <p className="text-gray-600">
          {isAdmin
            ? "View employee hours and wages for the selected pay period."
            : "View your hours and wages for the selected pay period."}
        </p>
      </div>

      {/* Pay Period Selection */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".pay-period-selector")}
      >
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label
            htmlFor="pay-period-date-picker"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Date (Pay Period auto-calculated)
          </label>
          <input
            type="date"
            id="pay-period-date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
          />
          {payPeriod.label && (
            <p className="mt-2 text-sm text-gray-600">
              Pay Period: {payPeriod.label}
            </p>
          )}
        </div>
      </TutorialHighlight>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && payrollData.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">
            Payroll Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <span className="text-green-600">Employees:</span>
              <span className="ml-2 font-medium">{totalEmployees}</span>
            </div>
            <div>
              <span className="text-green-600">Total Hours:</span>
              <span className="ml-2 font-medium">{totalHours.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-green-600">Total Events:</span>
              <span className="ml-2 font-medium">{totalEvents}</span>
            </div>
            <div>
              <span className="text-green-600">Gross Payroll:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(totalGrossPay)}
              </span>
            </div>
            <div>
              <span className="text-red-600">Total Deductions:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(totalDeductions)}
              </span>
            </div>
            <div>
              <span className="text-blue-600">Net Payroll:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(totalNetPay)}
              </span>
            </div>
          </div>

          {/* Hours Breakdown by Shift Type */}
          {Object.keys(hoursByShiftType).length > 0 && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Hours by Shift Type
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                {Object.entries(hoursByShiftType).map(([shiftType, hours]) => (
                  <div key={shiftType}>
                    <span className="text-green-600">{shiftType}:</span>
                    <span className="ml-2 font-medium">
                      {hours.toFixed(1)}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading payroll data...</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Events
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrollData.length > 0 ? (
                    payrollData.map((data) => (
                      <tr
                        key={data.employee.employee_id}
                        className="hover:bg-gray-50"
                      >
                        <td
                          className="px-6 py-4 whitespace-nowrap max-w-xs"
                          style={{ maxWidth: 180 }}
                        >
                          <div>
                            <div
                              className="text-sm font-medium text-gray-900 truncate"
                              style={{
                                maxWidth: 160,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={`${data.employee.first_name} ${data.employee.last_name}`}
                            >
                              {data.employee.first_name}{" "}
                              {data.employee.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {data.employee.employee_type}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.totalEvents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {data.totalHours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(data.currentWage)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(data.grossPay)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-0.5">
                            <div className="flex justify-between">
                              <span>Federal:</span>
                              <span>
                                {formatCurrency(data.taxDeductions.federalTax)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Provincial:</span>
                              <span>
                                {formatCurrency(
                                  data.taxDeductions.provincialTax
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>CPP:</span>
                              <span>
                                {formatCurrency(
                                  data.taxDeductions.cppContribution
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>EI:</span>
                              <span>
                                {formatCurrency(data.taxDeductions.eiPremium)}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-0.5">
                              <span>Total:</span>
                              <span>
                                {formatCurrency(
                                  data.taxDeductions.totalDeductions
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(data.netPay)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No payroll data found for the selected pay period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {payrollData.length > 0 ? (
              payrollData.map((data) => (
                <div
                  key={data.employee.employee_id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  {/* Employee Header */}
                  <div className="border-b border-gray-200 pb-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {data.employee.first_name} {data.employee.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {data.employee.employee_type}
                    </p>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        Events
                      </span>
                      <p className="text-sm font-medium">{data.totalEvents}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        Hours
                      </span>
                      <p className="text-sm font-medium">
                        {data.totalHours.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        Rate
                      </span>
                      <p className="text-sm font-medium">
                        {formatCurrency(data.currentWage)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase">
                        Gross Pay
                      </span>
                      <p className="text-sm font-medium">
                        {formatCurrency(data.grossPay)}
                      </p>
                    </div>
                  </div>

                  {/* Tax Deductions */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Tax Deductions
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Federal:</span>
                        <span>
                          {formatCurrency(data.taxDeductions.federalTax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provincial:</span>
                        <span>
                          {formatCurrency(data.taxDeductions.provincialTax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPP:</span>
                        <span>
                          {formatCurrency(data.taxDeductions.cppContribution)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>EI:</span>
                        <span>
                          {formatCurrency(data.taxDeductions.eiPremium)}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Total:</span>
                        <span>
                          {formatCurrency(data.taxDeductions.totalDeductions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">
                        Net Pay
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(data.netPay)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payroll data found for the selected pay period.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
