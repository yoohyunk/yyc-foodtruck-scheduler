import React from "react";
import { Employee } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignedEmployees: Employee[];
  isLoadingEmployees: boolean;
  event: any;
  onEmployeeSelect: (employee: Employee) => void;
  employeeFilter: string;
  onEmployeeFilterChange: (filter: string) => void;
  shouldHighlight: (selector: string) => boolean;
}

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  employees,
  assignedEmployees,
  isLoadingEmployees,
  event,
  onEmployeeSelect,
  employeeFilter,
  onEmployeeFilterChange,
  shouldHighlight,
}: EmployeeSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Select Employees</h3>
        <div className="modal-body">
          {/* Employee Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Employee Type:
            </label>
            <select
              value={employeeFilter}
              onChange={(e) => onEmployeeFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Employees</option>
              <option value="Server">Server Only</option>
              <option value="Driver">Driver Only</option>
              <option value="Manager">Manager Only</option>
            </select>
          </div>

          {isLoadingEmployees ? (
            <p className="text-gray-500">Loading employees...</p>
          ) : employees.length > 0 ? (
            employees
              .filter(
                (employee) =>
                  employeeFilter === "all" ||
                  employee.employee_type === employeeFilter
              )
              .map((employee, index) => (
                <TutorialHighlight
                  key={employee.employee_id}
                  isHighlighted={shouldHighlight(
                    `.modal-body .employee-checkbox:nth-child(${index + 1})`
                  )}
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
                      onChange={() => onEmployeeSelect(employee)}
                      disabled={
                        !assignedEmployees.some(
                          (e) => e.employee_id === employee.employee_id
                        ) &&
                        assignedEmployees.length >=
                          (event.number_of_servers_needed || 0)
                      }
                    />
                    <span className="employee-name">
                      {employee.first_name} {employee.last_name} (
                      {employee.employee_type || "Unknown"})
                    </span>
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
