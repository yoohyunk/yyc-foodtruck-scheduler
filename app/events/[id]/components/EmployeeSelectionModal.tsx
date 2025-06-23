import React, { useEffect, useState, useMemo } from "react";
import { Employee } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { calculateDistance } from "../../../AlgApi/distance";
import { wagesApi } from "@/lib/supabase/wages";
import { Tables } from "@/database.types";

interface EmployeeWithDistanceAndWage extends Employee {
  distance?: number;
  currentWage?: number;
}

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignedEmployees: Employee[];
  isLoadingEmployees: boolean;
  event: { addresses?: Tables<"addresses">; number_of_servers_needed?: number };
  onEmployeeSelection: (employee: Employee) => void;
  shouldHighlight: (selector: string) => boolean;
  employeeFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  employees,
  assignedEmployees,
  isLoadingEmployees,
  event,
  onEmployeeSelection,
  shouldHighlight,
  employeeFilter,
  onFilterChange,
}: EmployeeSelectionModalProps) {
  const [employeesWithDistance, setEmployeesWithDistance] = useState<
    EmployeeWithDistanceAndWage[]
  >([]);
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Calculate distances and get wages when modal opens
  useEffect(() => {
    if (isOpen && event?.addresses && employees.length > 0) {
      calculateDistancesAndWages();
    }
  }, [isOpen, event, employees]);

  const calculateDistancesAndWages = async () => {
    setIsLoadingDistances(true);
    try {
      const eventAddress = event.addresses;
      if (!eventAddress) return;

      const employeesWithData = await Promise.all(
        employees.map(async (employee) => {
          let distance = undefined;
          let currentWage = undefined;

          // Get employee's current wage
          try {
            const wage = await wagesApi.getCurrentWage(employee.employee_id);
            currentWage = wage?.hourly_wage;
          } catch (error) {
            console.error(
              `Error fetching wage for employee ${employee.employee_id}:`,
              error
            );
          }

          // Calculate distance if employee has address
          if (
            employee.addresses?.latitude &&
            employee.addresses?.longitude &&
            eventAddress?.latitude &&
            eventAddress?.longitude
          ) {
            try {
              const employeeCoords = {
                lat: parseFloat(employee.addresses.latitude as string),
                lng: parseFloat(employee.addresses.longitude as string),
              };
              const eventCoords = {
                lat: parseFloat(eventAddress.latitude as string),
                lng: parseFloat(eventAddress.longitude as string),
              };

              distance = await calculateDistance(employeeCoords, eventCoords);
            } catch (error) {
              console.error(
                `Error calculating distance for employee ${employee.employee_id}:`,
                error
              );
            }
          }

          return {
            ...employee,
            distance,
            currentWage,
          };
        })
      );

      setEmployeesWithDistance(employeesWithData);
    } catch (error) {
      console.error("Error calculating distances and wages:", error);
    } finally {
      setIsLoadingDistances(false);
    }
  };

  const formatDistance = (distance: number | undefined) => {
    if (distance === undefined) return "N/A";
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  };

  const formatWage = (wage: number | undefined) => {
    if (wage === undefined) return "N/A";
    return `$${wage.toFixed(2)}/hr`;
  };

  const sortedAndFilteredEmployees = useMemo(() => {
    let processedEmployees = employeesWithDistance.filter(
      (employee) =>
        employeeFilter === "all" || employee.employee_type === employeeFilter
    );

    if (sortByDistance) {
      processedEmployees.sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)
      );
    }
    return processedEmployees;
  }, [employeesWithDistance, employeeFilter, sortByDistance]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Select Employees</h3>
        <div className="modal-body">
          {/* Employee Filter and Sort */}
          <div className="flex justify-between items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <select
                value={employeeFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                <option value="Server">Server Only</option>
                <option value="Driver">Driver Only</option>
                <option value="Manager">Manager Only</option>
              </select>
            </div>
            <button
              onClick={() => setSortByDistance((prev) => !prev)}
              className="btn-secondary"
            >
              {sortByDistance ? "Clear Sort" : "Sort by Distance"}
            </button>
          </div>

          {isLoadingEmployees || isLoadingDistances ? (
            <p className="text-gray-500">Loading employees...</p>
          ) : sortedAndFilteredEmployees.length > 0 ? (
            sortedAndFilteredEmployees.map((employee, index) => (
              <TutorialHighlight
                key={employee.employee_id}
                isHighlighted={
                  index === 0 &&
                  shouldHighlight(".modal-body .employee-checkbox:first-child")
                }
              >
                <label
                  className={`employee-label ${
                    assignedEmployees.some(
                      (e) => e.employee_id === employee.employee_id
                    )
                      ? "employee-label-selected"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="employee-checkbox"
                    checked={assignedEmployees.some(
                      (e) => e.employee_id === employee.employee_id
                    )}
                    onChange={() => onEmployeeSelection(employee)}
                    disabled={
                      !assignedEmployees.some(
                        (e) => e.employee_id === employee.employee_id
                      ) &&
                      assignedEmployees.length >=
                        (event.number_of_servers_needed || 0)
                    }
                  />
                  <div className="employee-info">
                    <span className="employee-name">
                      {employee.first_name} {employee.last_name} (
                      {employee.employee_type || "Unknown"})
                    </span>
                    <div className="employee-details text-sm text-gray-600">
                      <span>Distance: {formatDistance(employee.distance)}</span>
                      <span>Wage: {formatWage(employee.currentWage)}</span>
                    </div>
                  </div>
                </label>
              </TutorialHighlight>
            ))
          ) : (
            <p className="text-gray-500">No employees available.</p>
          )}
        </div>
        <div className="modal-footer">
          <TutorialHighlight
            isHighlighted={shouldHighlight(
              ".modal-footer button.btn-secondary"
            )}
          >
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </TutorialHighlight>
          <button className="btn-primary" onClick={onClose}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
