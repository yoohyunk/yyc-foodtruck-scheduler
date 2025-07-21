import React, { useEffect, useState } from "react";
import { Tables } from "@/database.types";
import { employeesApi } from "@/lib/supabase/employees";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import ErrorModal from "@/app/components/ErrorModal";

type Employee = Tables<"employees">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployees: Employee[];
  setSelectedEmployees: (emps: Employee[]) => void;
  assignmentStart: string; // ISO string
  assignmentEnd: string; // ISO string
};

const EmployeeSelectionModalForAssignment: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedEmployees,
  setSelectedEmployees,
  assignmentStart,
  assignmentEnd,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availability, setAvailability] = useState<
    Record<string, { isAvailable: boolean; reason: string }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      employeesApi
        .getAllEmployees()
        .then((emps: Employee[]) => {
          setEmployees(emps);
          emps.forEach(async (emp) => {
            employeeAvailabilityApi
              .checkEmployeeAvailability(emp, assignmentStart, assignmentEnd)
              .then((result) => {
                setAvailability((prev) => ({
                  ...prev,
                  [emp.employee_id]: result,
                }));
              })
              .catch(() => {
                setError("Failed to check employee availability.");
                setShowErrorModal(true);
              });
          });
        })
        .catch(() => {
          setError("Failed to load employees.");
          setShowErrorModal(true);
        });
    }
  }, [isOpen, assignmentStart, assignmentEnd]);

  const toggleEmployee = (emp: Employee) => {
    if (selectedEmployees.some((e) => e.employee_id === emp.employee_id)) {
      setSelectedEmployees(
        selectedEmployees.filter((e) => e.employee_id !== emp.employee_id)
      );
    } else {
      setSelectedEmployees([...selectedEmployees, emp]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-container"
        style={{ maxWidth: 500, width: "90%", position: "relative" }}
      >
        <div className="modal-header">
          <h3
            className="modal-title"
            style={{ width: "100%", textAlign: "center" }}
          >
            Select Employees
          </h3>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        </div>
        <div
          className="modal-body"
          style={{ maxHeight: 320, overflowY: "auto", marginBottom: 0 }}
        >
          {employees.map((emp) => {
            const avail = availability[emp.employee_id];
            const isAssigned = selectedEmployees.some(
              (e) => e.employee_id === emp.employee_id
            );
            const isDisabled = avail && !avail.isAvailable;
            return (
              <label
                key={emp.employee_id}
                className={`employee-label w-full flex items-center justify-between px-0 ${
                  isAssigned ? "employee-label-selected" : ""
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                style={{ marginBottom: "0.5rem" }}
              >
                <div className="flex-grow flex items-center justify-between w-full pl-3 mr-4">
                  <div className="flex items-center gap-2">
                    {/* Availability indicator */}
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        avail && avail.isAvailable
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      title={
                        avail && avail.isAvailable
                          ? "Available"
                          : "Not Available"
                      }
                    />
                    <div>
                      <span
                        className="font-semibold"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {emp.first_name} {emp.last_name}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({emp.employee_type || "Unknown"})
                      </span>
                      {avail && !avail.isAvailable && avail.reason && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ {avail.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="employee-checkbox mr-3"
                  checked={isAssigned}
                  onChange={() => !isDisabled && toggleEmployee(emp)}
                  disabled={isDisabled}
                />
              </label>
            );
          })}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
        {showErrorModal && (
          <ErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            errors={error ? [{ field: "form", message: error }] : []}
            title="Error"
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeSelectionModalForAssignment;
