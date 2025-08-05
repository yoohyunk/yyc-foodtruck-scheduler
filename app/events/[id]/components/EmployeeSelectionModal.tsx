import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Employee } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { calculateStraightLineDistance } from "@/lib/utils/distance";
import { eventsApi } from "@/lib/supabase/events";
import { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import ErrorModal from "../../../components/ErrorModal";

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
  onSaveAssignments: (selectedEmployeeIds: string[]) => void;
  shouldHighlight: (selector: string) => boolean;
  employeeFilter: string;
  onFilterChange: (filter: string) => void;
}

// Memoized employee item component
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
          <div className="flex items-center gap-2">
            {/* Availability indicator */}
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                employee.isAvailable ? "bg-green-500" : "bg-red-500"
              }`}
              title={employee.isAvailable ? "Available" : "Not Available"}
            />
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

// Global cache for employee data
const employeeDataCache = new Map<string, EmployeeWithDistanceAndWage[]>();

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  employees,
  assignedEmployees,
  isLoadingEmployees,
  event,
  onSaveAssignments,
  shouldHighlight,
  employeeFilter,
  onFilterChange,
}: EmployeeSelectionModalProps) {
  const [employeesWithDistance, setEmployeesWithDistance] = useState<
    EmployeeWithDistanceAndWage[]
  >([]);
  const [isLoadingDistances, setIsLoadingDistances] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(true);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [localRequiredServers, setLocalRequiredServers] = useState(
    event.number_of_servers_needed || 0
  );
  const [showServerDecreaseWarning, setShowServerDecreaseWarning] =
    useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const supabase = createClient();

  // Generate cache key for this event and filter combination
  const cacheKey = useMemo(() => {
    const employeeIds = employees
      .map((emp) => emp.employee_id)
      .sort()
      .join(",");
    const eventKey = `${event.id}-${event.start_date}-${event.end_date}`;
    return `${eventKey}-${employeeFilter}-${employeeIds}`;
  }, [event.id, event.start_date, event.end_date, employeeFilter, employees]);

  // Initialize selected employees when modal opens
  useEffect(() => {
    if (isOpen) {
      const newSelectedEmployees = new Set<string>();
      assignedEmployees.forEach((emp) => {
        newSelectedEmployees.add(emp.employee_id);
      });
      setSelectedEmployees(newSelectedEmployees);
      setLocalRequiredServers(event.number_of_servers_needed || 0);
    }
  }, [isOpen, assignedEmployees, event.number_of_servers_needed]);

  // Check employee availability using centralized function
  const checkEmployeeAvailability = useCallback(
    async (
      employee: Employee
    ): Promise<{ isAvailable: boolean; reason: string }> => {
      if (!event.start_date || !event.end_date) {
        return { isAvailable: true, reason: "" };
      }

      return employeeAvailabilityApi.checkEmployeeAvailability(
        employee,
        event.start_date,
        event.end_date,
        event.id
      );
    },
    [event.id, event.start_date, event.end_date]
  );

  // Load employee wages
  const loadEmployeeWages = useCallback(async () => {
    if (employees.length === 0) return new Map();

    const employeeIds = employees.map((emp) => emp.employee_id);
    const { data: wagesData } = await supabase
      .from("wage")
      .select("employee_id, hourly_wage")
      .in("employee_id", employeeIds)
      .order("start_date", { ascending: false });

    const wageMap = new Map();
    if (wagesData) {
      // Group by employee_id and take the most recent wage for each
      wagesData.forEach((wage) => {
        if (!wageMap.has(wage.employee_id)) {
          wageMap.set(wage.employee_id, wage.hourly_wage);
        }
      });
    }
    return wageMap;
  }, [employees, supabase]);

  // Calculate distances and process employee data
  const calculateDistancesAndWages = useCallback(
    async (filter: string) => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoadingDistances(true);

      try {
        const eventAddress = event.addresses;
        if (!eventAddress) {
          setIsLoadingDistances(false);
          return;
        }

        // Check cache first
        if (employeeDataCache.has(cacheKey)) {
          const cachedData = employeeDataCache.get(cacheKey)!;
          setEmployeesWithDistance(cachedData);
          setIsLoadingDistances(false);
          return;
        }

        // Load wages
        const wageMap = await loadEmployeeWages();

        // Filter employees by type
        let filteredEmployees = employees;
        if (filter !== "all") {
          filteredEmployees = employees.filter(
            (e) => e.employee_type === filter
          );
        }

        // Process employees
        const employeesWithData = await Promise.all(
          filteredEmployees.map(async (employee) => {
            // Check if request was cancelled
            if (abortController.signal.aborted) {
              throw new Error("Request cancelled");
            }

            let distance: number | undefined;
            const currentWage = wageMap.get(employee.employee_id);

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

                distance = calculateStraightLineDistance(
                  employeeCoords,
                  eventCoords
                );
                console.log(
                  `Distance for ${employee.first_name} ${employee.last_name}:`,
                  {
                    employeeCoords,
                    eventCoords,
                    distance,
                  }
                );
              } catch (error) {
                console.error(
                  `Error calculating distance for employee ${employee.employee_id}:`,
                  error
                );
              }
            }

            // Check availability
            const availability = await checkEmployeeAvailability(employee);

            console.log(
              `Availability for ${employee.first_name} ${employee.last_name}:`,
              {
                isAvailable: availability.isAvailable,
                reason: availability.reason,
                employeeId: employee.employee_id,
                employeeType: employee.employee_type,
                isAvailableFlag: employee.is_available,
                availability: employee.availability,
              }
            );

            return {
              ...employee,
              distance,
              currentWage,
              isAvailable: availability.isAvailable,
              availabilityReason: availability.reason,
            };
          })
        );

        // Check if request was cancelled before updating state
        if (abortController.signal.aborted) {
          return;
        }

        // Cache the results
        employeeDataCache.set(cacheKey, employeesWithData);
        setEmployeesWithDistance(employeesWithData);
        setIsLoadingDistances(false);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error calculating distances and wages:", error);
          setIsLoadingDistances(false);
        }
      }
    },
    [
      event.addresses,
      employees,
      loadEmployeeWages,
      checkEmployeeAvailability,
      cacheKey,
    ]
  );

  // Load employee data when modal opens or filter changes
  useEffect(() => {
    if (isOpen && event?.addresses && employees.length > 0) {
      calculateDistancesAndWages(employeeFilter);
    }
  }, [
    isOpen,
    event?.addresses,
    employees.length,
    employeeFilter,
    calculateDistancesAndWages,
  ]);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setEmployeesWithDistance([]);
      setIsLoadingDistances(false);
    }
  }, [isOpen]);

  // Clear cache when event changes
  useEffect(() => {
    const eventKey = `${event.id}-${event.start_date}-${event.end_date}`;
    const keysToDelete = Array.from(employeeDataCache.keys()).filter(
      (key) => !key.startsWith(eventKey)
    );
    keysToDelete.forEach((key) => employeeDataCache.delete(key));
  }, [event.id, event.start_date, event.end_date]);

  // Utility functions
  const formatDistance = useCallback((distance: number | undefined) => {
    if (distance === undefined) return "N/A";
    if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
    return `${distance.toFixed(1)}km`;
  }, []);

  const formatWage = useCallback((wage: number | undefined) => {
    if (wage === undefined) return "N/A";
    return `$${wage.toFixed(2)}/hr`;
  }, []);

  // Split and sort employees for each section
  const {
    assignedEmployeesSorted,
    availableEmployeesSorted,
    unavailableEmployeesSorted,
  } = useMemo(() => {
    // Employees in the modal's current list who are assigned
    const assignedEmployeesInList = employeesWithDistance.filter((e) =>
      selectedEmployees.has(e.employee_id)
    );
    // Employees in the modal's current list who are not assigned but available
    const availableEmployeesInList = employeesWithDistance.filter(
      (e) => !selectedEmployees.has(e.employee_id) && e.isAvailable
    );
    // Employees in the modal's current list who are not available
    const unavailableEmployeesInList = employeesWithDistance.filter(
      (e) => !e.isAvailable
    );

    // Debug logging for unavailable employees
    console.log("EmployeeSelectionModal - Unavailable employees:", {
      totalEmployees: employeesWithDistance.length,
      unavailableCount: unavailableEmployeesInList.length,
      unavailableEmployees: unavailableEmployeesInList.map((emp) => ({
        name: `${emp.first_name} ${emp.last_name}`,
        isAvailable: emp.isAvailable,
        reason: emp.availabilityReason,
        employeeType: emp.employee_type,
      })),
    });

    // Sort each section independently
    const sortFn = (
      a: EmployeeWithDistanceAndWage,
      b: EmployeeWithDistanceAndWage
    ) => {
      if (sortByDistance) {
        // Sort by distance first, then by wage
        if (a.distance === Infinity && b.distance !== Infinity) return 1;
        if (a.distance !== Infinity && b.distance === Infinity) return -1;
        if (a.distance === Infinity && b.distance === Infinity) {
          return (a.currentWage || 0) - (b.currentWage || 0);
        }
        if (Math.abs((a.distance || 0) - (b.distance || 0)) <= 5) {
          return (a.currentWage || 0) - (b.currentWage || 0);
        }
        return (a.distance || 0) - (b.distance || 0);
      } else {
        // Sort by wage first, then by distance
        if ((a.currentWage || 0) !== (b.currentWage || 0)) {
          return (a.currentWage || 0) - (b.currentWage || 0);
        }
        if (a.distance === Infinity && b.distance !== Infinity) return 1;
        if (a.distance !== Infinity && b.distance === Infinity) return -1;
        return (a.distance || 0) - (b.distance || 0);
      }
    };

    return {
      assignedEmployeesSorted: assignedEmployeesInList.sort(sortFn),
      availableEmployeesSorted: availableEmployeesInList.sort(sortFn),
      unavailableEmployeesSorted: unavailableEmployeesInList.sort(sortFn),
    };
  }, [employeesWithDistance, selectedEmployees, sortByDistance]);

  // Event handlers
  const handleChangeRequiredServers = (delta: number) => {
    if (delta < 0 && selectedEmployees.size > localRequiredServers - 1) {
      setShowServerDecreaseWarning(true);
      return;
    }
    setLocalRequiredServers((prev) => Math.max(0, prev + delta));
  };

  const handleLocalEmployeeSelection = (employee: Employee) => {
    const newSelectedEmployees = new Set(selectedEmployees);

    if (newSelectedEmployees.has(employee.employee_id)) {
      newSelectedEmployees.delete(employee.employee_id);
    } else {
      if (newSelectedEmployees.size >= localRequiredServers) {
        alert(
          `Maximum number of servers (${localRequiredServers}) already selected.`
        );
        return;
      }
      newSelectedEmployees.add(employee.employee_id);
    }

    setSelectedEmployees(newSelectedEmployees);
  };

  const handleSaveAssignments = async () => {
    const selectedEmployeeIds = Array.from(selectedEmployees);

    // Update event if required server number changed
    if (localRequiredServers !== event.number_of_servers_needed && event.id) {
      try {
        await eventsApi.updateEvent(event.id, {
          number_of_servers_needed: localRequiredServers,
        });
      } catch (error) {
        console.error("Failed to update required server number:", error);
        alert("Failed to update required server number.");
        return;
      }
    }

    onSaveAssignments(selectedEmployeeIds);
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
            ({selectedEmployees.size}/{localRequiredServers} selected)
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
          {/* Controls */}
          <div
            className="flex flex-wrap items-end mb-3 gap-2"
            style={{ flexShrink: 0 }}
          >
            {/* Filter by Type Dropdown */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <TutorialHighlight
                isHighlighted={shouldHighlight(".employee-filter-dropdown")}
              >
                <select
                  value={employeeFilter}
                  onChange={(e) => onFilterChange(e.target.value)}
                  className="input-field employee-filter-dropdown text-sm px-3 py-1"
                  style={{
                    minWidth: "180px",
                    maxWidth: "240px",
                    borderColor:
                      employeeFilter === "all"
                        ? "var(--text-muted)"
                        : employeeFilter === "Driver"
                          ? "var(--secondary-light)"
                          : employeeFilter === "Server"
                            ? "var(--secondary-medium)"
                            : employeeFilter === "Admin"
                              ? "var(--primary-light)"
                              : "var(--text-muted)",
                  }}
                >
                  <option value="all">All Employees</option>
                  <option value="Server">Server Only</option>
                  <option value="Driver">Driver Only</option>
                  <option value="Admin">Admin Only</option>
                </select>
              </TutorialHighlight>
            </div>

            <div className="flex-grow" />

            {/* Required Servers and Sort Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Required Servers Control */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-700">Servers:</span>
                <button
                  type="button"
                  onClick={() => handleChangeRequiredServers(-1)}
                  className="btn btn-secondary px-2 py-0.5 text-base font-bold h-7 w-7 flex items-center justify-center"
                  aria-label="Decrease required servers"
                  style={{ minWidth: "1.75rem" }}
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  value={localRequiredServers}
                  onChange={(e) =>
                    setLocalRequiredServers(Math.max(0, Number(e.target.value)))
                  }
                  className="input-field w-10 text-center font-semibold text-sm h-7 px-1"
                  style={{ minWidth: "2.25rem" }}
                />
                <button
                  type="button"
                  onClick={() => handleChangeRequiredServers(1)}
                  className="btn btn-secondary px-2 py-0.5 text-base font-bold h-7 w-7 flex items-center justify-center"
                  aria-label="Increase required servers"
                  style={{ minWidth: "1.75rem" }}
                >
                  +
                </button>
              </div>

              {/* Sort by Distance Button */}
              <div className="flex flex-col items-end">
                <TutorialHighlight
                  isHighlighted={shouldHighlight(".sort-by-distance-button")}
                >
                  <button
                    type="button"
                    onClick={() => setSortByDistance(!sortByDistance)}
                    className={`btn sort-by-distance-button ${
                      sortByDistance ? "btn-primary" : "btn-secondary"
                    } text-xs h-8 px-3`}
                  >
                    {sortByDistance ? "Distance" : "Wage"}
                  </button>
                </TutorialHighlight>
                <span className="text-xs text-gray-500 mt-1">
                  Available employees always shown first • Distance: closest
                  first • Wage: lowest first
                </span>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div
            className="employee-list-container"
            style={{ flexGrow: 1, overflowY: "auto" }}
          >
            {isLoadingEmployees || isLoadingDistances ? (
              <p className="text-gray-500">Loading employees...</p>
            ) : assignedEmployeesSorted.length +
                availableEmployeesSorted.length +
                unavailableEmployeesSorted.length >
              0 ? (
              <>
                {selectedEmployees.size >= localRequiredServers &&
                  localRequiredServers > 0 && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-green-800 text-sm">
                        ✅ Maximum number of servers ({localRequiredServers})
                        assigned. You can unassign servers to add different
                        ones.
                      </p>
                    </div>
                  )}
                {/* Assigned Employees Section */}
                <div className="mb-4">
                  <h4 className="font-semibold text-base mb-2 border-b pb-1">
                    Assigned Employees
                  </h4>
                  {assignedEmployeesSorted.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No employees assigned.
                    </p>
                  ) : (
                    assignedEmployeesSorted.map((employee, index) => {
                      const isAssigned = true;
                      const isDisabled = false; // Always allow unassigning
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
                    })
                  )}
                </div>
                {/* Available Employees Section */}
                <div>
                  <h4 className="font-semibold text-base mb-2 border-b pb-1">
                    Available Employees
                  </h4>
                  {availableEmployeesSorted.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No available employees.
                    </p>
                  ) : (
                    availableEmployeesSorted.map((employee, index) => {
                      const isAssigned = false;
                      const maxReached =
                        selectedEmployees.size >= localRequiredServers;
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
                    })
                  )}
                </div>
                {/* Unavailable Employees Section */}
                <div>
                  <h4 className="font-semibold text-base mb-2 border-b pb-1">
                    Unavailable Employees
                  </h4>
                  {unavailableEmployeesSorted.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No unavailable employees.
                    </p>
                  ) : (
                    unavailableEmployeesSorted.map((employee, index) => (
                      <EmployeeItem
                        key={employee.employee_id}
                        employee={employee}
                        isAssigned={false} // Always false for unavailable
                        isDisabled={true} // Always disabled for unavailable
                        onSelection={() => {}} // No selection for unavailable
                        shouldHighlight={shouldHighlight}
                        index={index}
                        formatDistance={formatDistance}
                        formatWage={formatWage}
                      />
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No employees available.</p>
            )}
          </div>
        </div>

        {/* Footer */}
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

      {/* Warning Modal */}
      <ErrorModal
        isOpen={showServerDecreaseWarning}
        onClose={() => setShowServerDecreaseWarning(false)}
        errors={[
          {
            field: "general",
            message: `You have selected more employees (${selectedEmployees.size}) than the required number of servers (${localRequiredServers - 1}). Please deselect some employees before decreasing.`,
          },
        ]}
        type="error"
        title="Too Many Selected"
      />
    </div>
  );
}
