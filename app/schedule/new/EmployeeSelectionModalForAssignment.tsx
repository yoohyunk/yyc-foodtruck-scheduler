import React, { useEffect, useState } from "react";
import { Tables } from "@/database.types";
import { employeesApi } from "@/lib/supabase/employees";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import { wagesApi } from "@/lib/supabase/wages";
import ErrorModal from "@/app/components/ErrorModal";

type Employee = Tables<"employees"> & { currentWage?: number };

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
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState("all");
  const [sortMode, setSortMode] = useState("alphabetical"); // 'alphabetical' or 'wage'

  useEffect(() => {
    if (isOpen) {
      employeesApi
        .getAllEmployees()
        .then(async (emps: Employee[]) => {
          // Fetch and attach current wage for each employee
          const empsWithWage = await Promise.all(
            emps.map(async (emp) => {
              try {
                const wageRecord = await wagesApi.getCurrentWage(emp.employee_id);
                return { ...emp, currentWage: wageRecord?.hourly_wage || 0 };
              } catch (e) {
                return { ...emp, currentWage: 0 };
              }
            })
          );
          setEmployees(empsWithWage);
          empsWithWage.forEach(async (emp) => {
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

  // Filter and sort employees before rendering
  const filteredAndSortedEmployees = employees
    .filter(emp => employeeTypeFilter === "all" || emp.employee_type === employeeTypeFilter)
    .sort((a, b) => {
      // Sort by availability first (available first)
      const availA = availability[a.employee_id]?.isAvailable ? 0 : 1;
      const availB = availability[b.employee_id]?.isAvailable ? 0 : 1;
      if (availA !== availB) return availA - availB;
      if (sortMode === "wage") {
        // Sort by wage (lowest first), then alphabetically
        const wageA = a.currentWage ?? 0;
        const wageB = b.currentWage ?? 0;
        if (wageA !== wageB) return wageA - wageB;
      }
      // Alphabetical fallback
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

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
        {/* Sorting and Filtering Controls */}
        <div className="flex items-center gap-2 mb-2 px-2">
          <select
            value={employeeTypeFilter}
            onChange={e => setEmployeeTypeFilter(e.target.value)}
            className="input-field text-sm px-3 py-1"
          >
            <option value="all">All Types</option>
            <option value="Server">Server</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
            className="input-field text-sm px-3 py-1"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="wage">Wage</option>
          </select>
        </div>
        <div
          className="modal-body"
          style={{ maxHeight: 320, overflowY: "auto", marginBottom: 0 }}
        >
          {filteredAndSortedEmployees.map((emp) => {
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
                {/* Wage and checkbox right-aligned */}
                <div className="flex items-center justify-end min-w-[110px] gap-2">
                  {typeof emp.currentWage === "number" && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)", minWidth: 60, textAlign: "right" }}
                    >
                      ${emp.currentWage.toFixed(2)}/hr
                    </span>
                  )}
                  <input
                    type="checkbox"
                    className="employee-checkbox mr-3"
                    checked={isAssigned}
                    onChange={() => !isDisabled && toggleEmployee(emp)}
                    disabled={isDisabled}
                  />
                </div>
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
