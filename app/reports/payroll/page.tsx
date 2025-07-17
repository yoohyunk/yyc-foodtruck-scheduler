"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { FiDollarSign, FiCalendar, FiArrowLeft, FiUsers } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { wagesApi } from "@/lib/supabase/wages";
import { Employee } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface PayrollData {
  employee: Employee;
  currentWage: number;
  totalHours: number;
  totalPay: number;
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

export default function PayrollReport(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string>("");
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate pay periods for current year
  const generatePayPeriods = (): PayPeriod[] => {
    const currentYear = new Date().getFullYear();
    const periods: PayPeriod[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const firstHalf: PayPeriod = {
        id: `${currentYear}-${month.toString().padStart(2, '0')}-01`,
        label: `${new Date(currentYear, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })} 1-15`,
        startDate: `${currentYear}-${month.toString().padStart(2, '0')}-01`,
        endDate: `${currentYear}-${month.toString().padStart(2, '0')}-15`,
      };
      
      const lastDay = new Date(currentYear, month, 0).getDate();
      const secondHalf: PayPeriod = {
        id: `${currentYear}-${month.toString().padStart(2, '0')}-16`,
        label: `${new Date(currentYear, month - 1, 1).toLocaleDateString('en-US', { month: 'short' })} 16-${lastDay}`,
        startDate: `${currentYear}-${month.toString().padStart(2, '0')}-16`,
        endDate: `${currentYear}-${month.toString().padStart(2, '0')}-${lastDay}`,
      };
      
      periods.push(firstHalf, secondHalf);
    }
    
    return periods;
  };

  const payPeriods = generatePayPeriods();

  // Set default to current pay period
  useEffect(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    let periodId: string;
    if (day <= 15) {
      periodId = `${year}-${month.toString().padStart(2, '0')}-01`;
    } else {
      periodId = `${year}-${month.toString().padStart(2, '0')}-16`;
    }
    
    setSelectedPayPeriod(periodId);
  }, []);

  const fetchPayrollData = async () => {
    if (!selectedPayPeriod) return;

    setIsLoading(true);
    setError(null);

    try {
      const selectedPeriod = payPeriods.find(p => p.id === selectedPayPeriod);
      if (!selectedPeriod) return;

      // Get all employees
      const allEmployees = await employeesApi.getAllEmployees();
      
      // Sort employees alphabetically by first name, then last name
      const sortedEmployees = allEmployees.sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      const payrollDataArray: PayrollData[] = [];

      for (const employee of sortedEmployees) {
        // Get current wage
        const currentWage = await wagesApi.getCurrentWage(employee.employee_id);
        
        // Get assignments for this pay period
        const assignments = await assignmentsApi.getAssignmentsByEmployeeId(employee.employee_id);
        const periodAssignments = assignments.filter(assignment => {
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
          events: { title: (a as any).events?.title ?? "Untitled Event" },
        }));

        // Calculate total hours (assuming 8 hours per assignment day)
        let totalHours = 0;
        for (const assignment of periodAssignments) {
          const start = new Date(assignment.start_date);
          const end = new Date(assignment.end_date);
          const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          totalHours += daysDiff * 8; // 8 hours per day
        }

        const totalPay = totalHours * (currentWage || 0);

        payrollDataArray.push({
          employee,
          currentWage: currentWage || 0,
          totalHours,
          totalPay,
          assignments: periodAssignmentsEnriched,
        });
      }

      setPayrollData(payrollDataArray);
    } catch (err) {
      console.error("Error fetching payroll data:", err);
      setError("Failed to load payroll data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPayPeriod) {
      fetchPayrollData();
    }
  }, [selectedPayPeriod]);

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
    const period = payPeriods.find(p => p.id === selectedPayPeriod);
    return period ? period.label : "";
  };

  const calculateTotals = () => {
    const totalHours = payrollData.reduce((sum, data) => sum + data.totalHours, 0);
    const totalPay = payrollData.reduce((sum, data) => sum + data.totalPay, 0);
    const totalEmployees = payrollData.filter(data => data.totalHours > 0).length;
    
    return { totalHours, totalPay, totalEmployees };
  };

  if (!isAdmin) {
    return (
      <div className="payroll-report">
        <h2 className="text-2xl text-primary-dark mb-4">Payroll Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  const { totalHours, totalPay, totalEmployees } = calculateTotals();

  return (
    <div className="payroll-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link href="/reports" className="mr-4 text-primary-dark hover:text-primary-medium">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">Payroll Report</h2>
        </div>
        <p className="text-gray-600">
          Calculate employee hours and wages for the selected pay period.
        </p>
      </div>

      {/* Pay Period Selection */}
      <TutorialHighlight isHighlighted={shouldHighlight(".pay-period-selector")}>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label htmlFor="pay-period-selector" className="block text-sm font-medium text-gray-700 mb-2">
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
                {period.label} ({formatDate(period.startDate)} - {formatDate(period.endDate)})
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
          <h3 className="text-sm font-medium text-green-800 mb-2">Payroll Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600">Employees with Hours:</span>
              <span className="ml-2 font-medium">{totalEmployees}</span>
            </div>
            <div>
              <span className="text-green-600">Total Hours:</span>
              <span className="ml-2 font-medium">{totalHours.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-green-600">Total Payroll:</span>
              <span className="ml-2 font-medium">{formatCurrency(totalPay)}</span>
            </div>
            <div>
              <span className="text-green-600">Average per Employee:</span>
              <span className="ml-2 font-medium">
                {totalEmployees > 0 ? formatCurrency(totalPay / totalEmployees) : "$0.00"}
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
        <div className="grid gap-4">
          {payrollData
            .filter(data => data.totalHours > 0) // Only show employees with hours
            .sort((a, b) => b.totalPay - a.totalPay) // Sort by total pay descending
            .map((data) => (
            <div key={data.employee.employee_id} className="employee-card bg-white p-6 rounded shadow">
              {/* Employee Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <FiUsers className="text-gray-400 mr-3 text-lg" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {data.employee.first_name} {data.employee.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {data.employee.employee_type} • {data.employee.user_email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(data.totalPay)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.totalHours.toFixed(1)} hours
                  </div>
                </div>
              </div>

              {/* Wage Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Hourly Rate:</span>
                    <span className="ml-2 font-medium">{formatCurrency(data.currentWage)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="ml-2 font-medium">{data.totalHours.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              {data.assignments.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FiCalendar className="mr-2" />
                    Event Assignments
                  </h4>
                  <div className="space-y-2">
                    {data.assignments.map((assignment) => (
                      <div key={assignment.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800">
                          {assignment.events.title || "Untitled Event"}
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatDate(assignment.start_date)} - {formatDate(assignment.end_date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pay Calculation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {data.currentWage} × {data.totalHours.toFixed(1)} hours
                  </span>
                  <span className="font-medium text-green-600">
                    = {formatCurrency(data.totalPay)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && payrollData.filter(data => data.totalHours > 0).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No payroll data found for the selected pay period.
        </div>
      )}
    </div>
  );
} 