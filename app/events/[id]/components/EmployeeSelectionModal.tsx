import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Employee } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { calculateDistance } from "../../../AlgApi/distance";
import { wagesApi } from "@/lib/supabase/wages";
import { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";

interface EmployeeWithDistanceAndWage extends Employee {
  distance?: number;
  currentWage?: number;
  isAvailable?: boolean;
  availabilityReason?: string;
}

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignedEmployees: Employee[];
  isLoadingEmployees: boolean;
  event: {
    id?: string;
    addresses?: Tables<"addresses">;
    number_of_servers_needed?: number;
    start_date?: string;
    end_date?: string;
  };
  onEmployeeSelection: (employee: Employee) => void;
  onSaveAssignments: (selectedEmployeeIds: string[]) => void;
  shouldHighlight: (selector: string) => boolean;
  employeeFilter: string;
  onFilterChange: (filter: string) => void;
}

// Memoized employee item component to prevent unnecessary re-renders
const EmployeeItem = React.memo(
  ({
    employee,
    isAssigned,
    isDisabled,
    onSelection,
    shouldHighlight,
    index,
    formatDistance,
    formatWage,
  }: {
    employee: EmployeeWithDistanceAndWage;
    isAssigned: boolean;
    isDisabled: boolean;
    onSelection: (employee: Employee) => void;
    shouldHighlight: (selector: string) => boolean;
    index: number;
    formatDistance: (distance: number | undefined) => string;
    formatWage: (wage: number | undefined) => string;
  }) => (
    <TutorialHighlight
      key={employee.employee_id}
      isHighlighted={
        index === 0 &&
        shouldHighlight(".modal-body .employee-checkbox:first-child")
      }
    >
      <label
        className={`employee-label w-full flex items-center justify-between px-0 ${
          isAssigned ? "employee-label-selected" : ""
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex-grow flex items-center justify-between w-full pl-3 mr-4">
          <div>
            <span className="font-semibold" style={{ whiteSpace: "nowrap" }}>
              {employee.first_name} {employee.last_name}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              ({employee.employee_type || "Unknown"})
            </span>
            {!employee.isAvailable && employee.availabilityReason && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ {employee.availabilityReason}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-700 flex items-center justify-end gap-4">
            <span className="mr-4">{formatDistance(employee.distance)}</span>
            <span>{formatWage(employee.currentWage)}</span>
          </div>
        </div>
        <input
          type="checkbox"
          className="employee-checkbox mr-3"
          checked={isAssigned}
          onChange={() => !isDisabled && onSelection(employee)}
          disabled={isDisabled || !employee.isAvailable}
        />
      </label>
    </TutorialHighlight>
  )
);

EmployeeItem.displayName = "EmployeeItem";

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  employees,
  assignedEmployees,
  isLoadingEmployees,
  event,
  onEmployeeSelection,
  onSaveAssignments,
  shouldHighlight,
  employeeFilter,
  onFilterChange,
}: EmployeeSelectionModalProps) {
  const [employeesWithDistance, setEmployeesWithDistance] = useState<
    EmployeeWithDistanceAndWage[]
  >([]);
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const supabase = createClient();

  // Initialize selected employees when modal opens
  useEffect(() => {
    if (isOpen) {
      const newSelectedEmployees = new Set<string>();
      assignedEmployees.forEach((emp) => {
        newSelectedEmployees.add(emp.employee_id);
      });
      setSelectedEmployees(newSelectedEmployees);
    }
  }, [isOpen, assignedEmployees]);

  // Memoize assigned employee IDs for faster lookups
  const assignedEmployeeIds = useMemo(
    () => new Set(assignedEmployees.map((emp) => emp.employee_id)),
    [assignedEmployees]
  );

  // Memoize the event key to prevent unnecessary recalculations
  const eventKey = useMemo(() => {
    return `${event.id}-${event.start_date}-${event.end_date}`;
  }, [event.id, event.start_date, event.end_date]);

  // Check employee availability for the event
  const checkEmployeeAvailability = useCallback(
    async (employee: Employee) => {
      if (!event.start_date || !event.end_date) {
        return { isAvailable: true, reason: "" };
      }

      const eventStart = new Date(event.start_date);
      const eventEnd = new Date(event.end_date);
      const dayOfWeek = eventStart.getDay();
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const eventDay = dayNames[dayOfWeek];

      // Check day availability
      const availability = employee.availability as string[] | null;
      if (!availability || !availability.includes(eventDay)) {
        return {
          isAvailable: false,
          reason: `Not available on ${eventDay}`,
        };
      }

      // Check for time off conflicts
      const { data: timeOffRequests } = await supabase
        .from("time_off_request")
        .select("*")
        .eq("employee_id", employee.employee_id)
        .eq("status", "Accepted");

      if (timeOffRequests && timeOffRequests.length > 0) {
        const hasTimeOffConflict = timeOffRequests.some((request) => {
          const requestStart = new Date(request.start_datetime);
          const requestEnd = new Date(request.end_datetime);

          return (
            (requestStart <= eventStart && requestEnd > eventStart) ||
            (requestStart < eventEnd && requestEnd >= eventEnd) ||
            (requestStart >= eventStart && requestEnd <= eventEnd)
          );
        });

        if (hasTimeOffConflict) {
          return {
            isAvailable: false,
            reason: "Has approved time off during this period",
          };
        }
      }

      // Check for other event conflicts
      const { data: otherAssignments } = await supabase
        .from("assignments")
        .select("start_date, end_date")
        .eq("employee_id", employee.employee_id)
        .neq("event_id", event.id || "");

      if (otherAssignments && otherAssignments.length > 0) {
        const hasEventConflict = otherAssignments.some((assignment) => {
          const assignmentStart = new Date(assignment.start_date);
          const assignmentEnd = new Date(assignment.end_date);

          return (
            (assignmentStart <= eventStart && assignmentEnd > eventStart) ||
            (assignmentStart < eventEnd && assignmentEnd >= eventEnd) ||
            (assignmentStart >= eventStart && assignmentEnd <= eventEnd)
          );
        });

        if (hasEventConflict) {
          return {
            isAvailable: false,
            reason: "Assigned to another event during this time",
          };
        }
      }

      return { isAvailable: true, reason: "" };
    },
    [eventKey, supabase]
  );

  const calculateDistancesAndWages = useCallback(async () => {
    // Only calculate if we haven't loaded data for this event yet
    if (hasLoadedData) return;

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

          // Check availability
          const availability = await checkEmployeeAvailability(employee);

          return {
            ...employee,
            distance,
            currentWage,
            isAvailable: availability.isAvailable,
            availabilityReason: availability.reason,
          };
        })
      );

      setEmployeesWithDistance(employeesWithData);
      setHasLoadedData(true);
    } catch (error) {
      console.error("Error calculating distances and wages:", error);
    } finally {
      setIsLoadingDistances(false);
    }
  }, [employees, event.addresses, checkEmployeeAvailability, hasLoadedData]);

  // Calculate distances and get wages when modal opens (only once per event)
  useEffect(() => {
    if (isOpen && event?.addresses && employees.length > 0 && !hasLoadedData) {
      calculateDistancesAndWages();
    }
  }, [
    isOpen,
    event.addresses,
    employees.length,
    hasLoadedData,
    calculateDistancesAndWages,
  ]);

  // Reset data when modal closes or event changes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedData(false);
      setEmployeesWithDistance([]);
    }
  }, [isOpen, eventKey]);

  const formatDistance = useCallback((distance: number | undefined) => {
    if (distance === undefined) return "N/A";
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  }, []);

  const formatWage = useCallback((wage: number | undefined) => {
    if (wage === undefined) return "N/A";
    return `$${wage.toFixed(2)}/hr`;
  }, []);

  const sortedAndFilteredEmployees = useMemo(() => {
    const processedEmployees = employeesWithDistance.filter(
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

  const handleLocalEmployeeSelection = (employee: Employee) => {
    const newSelectedEmployees = new Set(selectedEmployees);

    if (newSelectedEmployees.has(employee.employee_id)) {
      newSelectedEmployees.delete(employee.employee_id);
    } else {
      // Check if we can add more employees
      if (newSelectedEmployees.size >= (event.number_of_servers_needed || 0)) {
        alert(
          `Maximum number of servers (${event.number_of_servers_needed}) already selected.`
        );
        return;
      }
      newSelectedEmployees.add(employee.employee_id);
    }

    setSelectedEmployees(newSelectedEmployees);
  };

  const handleSaveAssignments = () => {
    // Convert selected employees Set to array of IDs
    const selectedEmployeeIds = Array.from(selectedEmployees);

    // Call the parent's save function
    onSaveAssignments(selectedEmployeeIds);

    // Close the modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-container"
        style={{
          width: "90vw",
          maxWidth: "950px",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <h3
          className="modal-title"
          style={{ flexShrink: 0, padding: "2rem 2rem 0.75rem 2rem" }}
        >
          Select Employees
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({selectedEmployees.size}/{event.number_of_servers_needed} selected)
          </span>
        </h3>
        <div
          className="modal-body"
          style={{
            flexGrow: 1,
            overflow: "hidden",
            padding: "0 2rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Employee Filter and Sort */}
          <div
            className="flex justify-between items-end mb-6"
            style={{ flexShrink: 0 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <TutorialHighlight
                isHighlighted={shouldHighlight(".employee-filter-dropdown")}
              >
                <select
                  value={employeeFilter}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 employee-filter-dropdown"
                >
                  <option value="all">All Employees</option>
                  <option value="Server">Server Only</option>
                  <option value="Driver">Driver Only</option>
                  <option value="Manager">Manager Only</option>
                </select>
              </TutorialHighlight>
            </div>
            <TutorialHighlight
              isHighlighted={shouldHighlight(".sort-by-distance-button")}
            >
              <button
                onClick={() => setSortByDistance((prev) => !prev)}
                className="btn-secondary sort-by-distance-button"
              >
                {sortByDistance ? "Clear Sort" : "Sort by Distance"}
              </button>
            </TutorialHighlight>
          </div>

          <div
            className="employee-list-container"
            style={{ flexGrow: 1, overflowY: "auto" }}
          >
            {isLoadingEmployees || isLoadingDistances ? (
              <p className="text-gray-500">Loading employees...</p>
            ) : sortedAndFilteredEmployees.length > 0 ? (
              <>
                {selectedEmployees.size >=
                  (event.number_of_servers_needed || 0) && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <p className="text-green-800 text-sm">
                      ✅ Maximum number of servers (
                      {event.number_of_servers_needed}) assigned. You can
                      unassign servers to add different ones.
                    </p>
                  </div>
                )}
                {sortedAndFilteredEmployees.map((employee, index) => {
                  const isAssigned = selectedEmployees.has(
                    employee.employee_id
                  );
                  const maxReached =
                    selectedEmployees.size >=
                    (event.number_of_servers_needed || 0);
                  const isDisabled = !isAssigned && maxReached;

                  return (
                    <EmployeeItem
                      key={employee.employee_id}
                      employee={employee}
                      isAssigned={isAssigned}
                      isDisabled={isDisabled}
                      onSelection={handleLocalEmployeeSelection}
                      shouldHighlight={shouldHighlight}
                      index={index}
                      formatDistance={formatDistance}
                      formatWage={formatWage}
                    />
                  );
                })}
              </>
            ) : (
              <p className="text-gray-500">No employees available.</p>
            )}
          </div>
        </div>
        <div
          className="modal-footer"
          style={{ flexShrink: 0, padding: "1.5rem 2rem" }}
        >
          <TutorialHighlight
            isHighlighted={shouldHighlight(
              ".modal-footer button.btn-secondary"
            )}
          >
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".modal-footer button.btn-primary")}
          >
            <button className="btn-primary" onClick={handleSaveAssignments}>
              Save
            </button>
          </TutorialHighlight>
        </div>
      </div>
    </div>
  );
}
