"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  useCallback,
  useMemo,
} from "react";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { wagesApi } from "@/lib/supabase/wages";
import { createClient } from "@/lib/supabase/client";
import { Employee } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import taxCalculations from "./taxCalculations.json";

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
  }>;
}

interface PayPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
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

export default function PayrollReport(): ReactElement {
  const { isAdmin, user } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string>("");
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Generate pay periods for current year
  const generatePayPeriods = (): PayPeriod[] => {
    const currentYear = new Date().getFullYear();
    const periods: PayPeriod[] = [];

    for (let month = 1; month <= 12; month++) {
      const firstHalf: PayPeriod = {
        id: `${currentYear}-${month.toString().padStart(2, "0")}-01`,
        label: `${new Date(currentYear, month - 1, 1).toLocaleDateString("en-US", { month: "short" })} 1-15`,
        startDate: `${currentYear}-${month.toString().padStart(2, "0")}-01`,
        endDate: `${currentYear}-${month.toString().padStart(2, "0")}-15`,
      };

      const lastDay = new Date(currentYear, month, 0).getDate();
      const secondHalf: PayPeriod = {
        id: `${currentYear}-${month.toString().padStart(2, "0")}-16`,
        label: `${new Date(currentYear, month - 1, 1).toLocaleDateString("en-US", { month: "short" })} 16-${lastDay}`,
        startDate: `${currentYear}-${month.toString().padStart(2, "0")}-16`,
        endDate: `${currentYear}-${month.toString().padStart(2, "0")}-${lastDay}`,
      };

      periods.push(firstHalf, secondHalf);
    }

    return periods;
  };

  // Memoize payPeriods to prevent infinite re-renders
  const payPeriods = useMemo(() => generatePayPeriods(), []);

  // Set default to current pay period
  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    let periodId: string;
    if (day <= 15) {
      periodId = `${year}-${month.toString().padStart(2, "0")}-01`;
    } else {
      periodId = `${year}-${month.toString().padStart(2, "0")}-16`;
    }

    setSelectedPayPeriod(periodId);
  }, []);

  const fetchPayrollData = useCallback(async () => {
    if (!selectedPayPeriod) return;

    setIsLoading(true);
    setError(null);

    try {
      const selectedPeriod = payPeriods.find((p) => p.id === selectedPayPeriod);
      if (!selectedPeriod) return;

      let employeesToProcess: Employee[] = [];

      if (isAdmin) {
        // Admin sees all employees
        const allEmployees = await employeesApi.getAllEmployees();
        employeesToProcess = allEmployees;
      } else {
        // Employee sees only themselves
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

      // Sort employees alphabetically by first name, then last name
      const sortedEmployees = employeesToProcess.sort((a, b) => {
        const nameA =
          `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
        const nameB =
          `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      const payrollDataArray: PayrollData[] = [];

      for (const employee of sortedEmployees) {
        // Get current wage
        const currentWageData = await wagesApi.getCurrentWage(
          employee.employee_id
        );

        // Extract hourly wage from the wage object
        const currentWage = currentWageData?.hourly_wage || 0;

        // Get assignments for this pay period
        const assignments = await assignmentsApi.getAssignmentsByEmployeeId(
          employee.employee_id
        );
        const periodAssignments = assignments.filter((assignment) => {
          const assignmentStart = new Date(assignment.start_date);
          const assignmentEnd = new Date(assignment.end_date);
          const periodStart = new Date(selectedPeriod.startDate);
          const periodEnd = new Date(selectedPeriod.endDate);

          return assignmentStart <= periodEnd && assignmentEnd >= periodStart;
        });

        // Map assignments to include required fields (events)
        const periodAssignmentsEnriched = periodAssignments.map((a) => ({
          id: a.id,
          start_date: a.start_date,
          end_date: a.end_date,
          events: {
            title:
              (a as { events?: { title?: string } }).events?.title ??
              "Untitled Event",
          },
        }));

        // Calculate total hours based on actual shift times
        let totalHours = 0;
        for (const assignment of periodAssignments) {
          const start = new Date(assignment.start_date);
          const end = new Date(assignment.end_date);

          // Calculate the difference in hours (including partial hours)
          const diffTime = end.getTime() - start.getTime();
          const diffHours = diffTime / (1000 * 60 * 60); // Convert milliseconds to hours

          totalHours += diffHours;
        }

        // Ensure wage is a valid number, default to 0 if null/undefined
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
          totalEvents: periodAssignments.length,
          grossPay,
          netPay,
          taxDeductions,
          assignments: periodAssignmentsEnriched,
        });
      }

      // Filter to only show employees with hours > 0 for admin view
      const filteredData = isAdmin
        ? payrollDataArray.filter((data) => data.totalHours > 0)
        : payrollDataArray;

      setPayrollData(filteredData);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      setError("Failed to load payroll data.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPayPeriod, isAdmin, user?.id, supabase, payPeriods]);

  useEffect(() => {
    if (selectedPayPeriod) {
      fetchPayrollData();
    }
  }, [selectedPayPeriod, fetchPayrollData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const getSelectedPeriodLabel = () => {
    const period = payPeriods.find((p) => p.id === selectedPayPeriod);
    return period ? period.label : "";
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

    return {
      totalHours,
      totalGrossPay,
      totalNetPay,
      totalDeductions,
      totalEvents,
      totalEmployees,
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
            htmlFor="pay-period-selector"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Pay Period
          </label>
          <select
            id="pay-period-selector"
            value={selectedPayPeriod}
            onChange={(e) => setSelectedPayPeriod(e.target.value)}
            className="input-field"
          >
            {payPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label} ({formatDate(period.startDate)} -{" "}
                {formatDate(period.endDate)})
              </option>
            ))}
          </select>
          {selectedPayPeriod && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {getSelectedPeriodLabel()}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
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
