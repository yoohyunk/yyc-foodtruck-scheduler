"use client";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Tables } from "@/database.types";

// Type for employee data from limited view
type EmployeeLimited = Tables<"employees_limited_view"> & {
  status?: string | null;
  created_at?: string;
  is_pending?: boolean;
  is_available?: boolean;
  addresses?: Tables<"addresses">;
  currentWage?: number;
  availability?: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
  }>;
};
import { createClient } from "@/lib/supabase/client";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployeeRoleFilterColor } from "../types";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import SearchInput from "../components/SearchInput";

export default function Employees(): ReactElement {
  const [employees, setEmployees] = useState<EmployeeLimited[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeLimited[]>(
    []
  );
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<EmployeeLimited | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { shouldHighlight } = useTutorial();
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"last" | "first">("last");
  const [activeStatus, setActiveStatus] = useState<"active" | "inactive">(
    "active"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { isAdmin } = useAuth();

  // Fetch employees from employee.json
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        let data, error;
        if (isAdmin) {
          // Admin: fetch from full employees table with address and wage data
          ({ data, error } = await supabase
            .from("employees")
            .select(
              `
              *,
              addresses (*)
            `
            )
            .order("created_at", { ascending: false }));
        } else {
          // Non-admin: fetch from limited view only
          ({ data, error } = await supabase
            .from("employees_limited_view")
            .select(
              `
              employee_id,
              first_name,
              last_name,
              employee_type,
              user_phone
            `
            )
            .order("first_name", { ascending: true }));
        }

        if (error) {
          console.error("Error fetching employees:", error);
          return;
        }

        if (!data) {
          console.log("No data returned");
          return;
        }

        let formattedEmployees;

        if (isAdmin) {
          // For admin: get wage data and availability for each employee
          const employeesWithWagesAndAvailability = await Promise.all(
            data.map(async (emp) => {
              try {
                // Fetch wage data
                const { data: wageData } = await supabase
                  .from("wage")
                  .select("hourly_wage")
                  .eq("employee_id", emp.employee_id)
                  .order("start_date", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                // Fetch availability data
                let availabilityData: Array<{
                  day_of_week: string;
                  start_time: string;
                  end_time: string;
                }> = [];
                try {
                  availabilityData =
                    await employeeAvailabilityApi.getEmployeeAvailability(
                      emp.employee_id
                    );
                } catch (availabilityError) {
                  console.error(
                    `Error fetching availability for employee ${emp.employee_id}:`,
                    availabilityError
                  );
                }

                return {
                  ...emp,
                  currentWage: wageData?.hourly_wage || 0,
                  availability: availabilityData,
                };
              } catch (error) {
                console.error(
                  `Error fetching data for employee ${emp.employee_id}:`,
                  error
                );
                return {
                  ...emp,
                  currentWage: 0,
                  availability: [],
                };
              }
            })
          );

          formattedEmployees = employeesWithWagesAndAvailability;
        } else {
          // For non-admin: add default values for missing fields
          formattedEmployees = data.map((emp) => ({
            ...emp,
            // Default values for fields not available in limited view
            created_at: new Date().toISOString(),
            is_pending: false,
            is_available: true, // Assume available for non-admin view
            addresses: null,
            currentWage: 0,
          }));
        }

        // Filter employees by activeStatus (only for admin since non-admin doesn't have access to is_available)
        let statusEmployees;
        if (isAdmin) {
          statusEmployees = formattedEmployees.filter((emp) =>
            activeStatus === "active" ? emp.is_available : !emp.is_available
          );
        } else {
          // For non-admin, show all employees since we can't filter by availability
          statusEmployees = formattedEmployees;
        }

        // Sort employees alphabetically by last name, then first name
        const sortedEmployees = statusEmployees.sort((a, b) => {
          if (sortMode === "last") {
            const lastA = (a.last_name || "").toLowerCase();
            const lastB = (b.last_name || "").toLowerCase();
            if (lastA < lastB) return -1;
            if (lastA > lastB) return 1;
            // If last names are equal, sort by first name
            const firstA = (a.first_name || "").toLowerCase();
            const firstB = (b.first_name || "").toLowerCase();
            if (firstA < firstB) return -1;
            if (firstA > firstB) return 1;
            return 0;
          } else {
            const firstA = (a.first_name || "").toLowerCase();
            const firstB = (b.first_name || "").toLowerCase();
            if (firstA < firstB) return -1;
            if (firstA > firstB) return 1;
            // If first names are equal, sort by last name
            const lastA = (a.last_name || "").toLowerCase();
            const lastB = (b.last_name || "").toLowerCase();
            if (lastA < lastB) return -1;
            if (lastA > lastB) return 1;
            return 0;
          }
        });

        setEmployees(sortedEmployees as EmployeeLimited[]);
        setFilteredEmployees(sortedEmployees as EmployeeLimited[]);
        // Set global variable for tutorial navigation
        if (typeof window !== "undefined" && sortedEmployees.length > 0) {
          (
            window as { __TUTORIAL_EMPLOYEE_ID?: string }
          ).__TUTORIAL_EMPLOYEE_ID = sortedEmployees[0].employee_id;
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchEmployees();
  }, [supabase, sortMode, activeStatus, isAdmin]);

  // Filter employees based on the active filter, activeStatus, and search term
  useEffect(() => {
    let filtered = employees;

    // Filter by employee type
    if (activeFilter !== "All") {
      filtered = filtered.filter(
        (employee) => employee.employee_type === activeFilter
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((employee) => {
        const firstName = (employee.first_name || "").toLowerCase();
        const lastName = (employee.last_name || "").toLowerCase();
        const phone = (employee.user_phone || "").toLowerCase();
        const role = (employee.employee_type || "").toLowerCase();

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          phone.includes(searchLower) ||
          role.includes(searchLower) ||
          `${firstName} ${lastName}`.includes(searchLower)
        );
      });
    }

    setFilteredEmployees(filtered);
  }, [activeFilter, searchTerm, employees]);

  // Add a useEffect to re-sort when sortMode changes
  useEffect(() => {
    setFilteredEmployees((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (sortMode === "last") {
          const lastA = (a.last_name || "").toLowerCase();
          const lastB = (b.last_name || "").toLowerCase();
          if (lastA < lastB) return -1;
          if (lastA > lastB) return 1;
          const firstA = (a.first_name || "").toLowerCase();
          const firstB = (b.first_name || "").toLowerCase();
          if (firstA < firstB) return -1;
          if (firstA > firstB) return 1;
          return 0;
        } else {
          const firstA = (a.first_name || "").toLowerCase();
          const firstB = (b.first_name || "").toLowerCase();
          if (firstA < firstB) return -1;
          if (firstA > firstB) return 1;
          const lastA = (a.last_name || "").toLowerCase();
          const lastB = (b.last_name || "").toLowerCase();
          if (lastA < lastB) return -1;
          if (lastA > lastB) return 1;
          return 0;
        }
      });
      return sorted;
    });
  }, [sortMode]);

  const handleDeleteClick = (employee: EmployeeLimited) => {
    // Debug: Test authentication and permissions
    console.log("Testing authentication and permissions...");
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error("Auth error:", error);
      } else {
        console.log("Current user:", user);
      }
    });

    // Debug: Test if we can read the employee data
    console.log("Testing employee data access...");
    supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employee.employee_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error reading employee data:", error);
        } else {
          console.log("Successfully read employee data:", data);
        }
      });

    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    console.log("Attempting to delete employee:", employeeToDelete.employee_id);

    try {
      // First, verify the employee exists
      const { error: checkError } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("employee_id", employeeToDelete.employee_id)
        .single();

      if (checkError) {
        console.error("Error checking if employee exists:", checkError);
        setError(`Employee not found: ${checkError.message}`);
        return;
      }

      console.log("Employee exists, proceeding with deletion...");

      // First, get the employee data to find related records
      const { data: employeeData, error: fetchError } = await supabase
        .from("employees")
        .select("employee_id, address_id")
        .eq("employee_id", employeeToDelete.employee_id)
        .single();

      if (fetchError) {
        console.error("Error fetching employee data:", fetchError);
        setError("Failed to fetch employee data for deletion.");
        return;
      }

      console.log("Employee data fetched:", employeeData);

      // Delete wage records
      if (employeeData) {
        console.log("Deleting wage records...");
        const { error: wageError } = await supabase
          .from("wage")
          .delete()
          .eq("employee_id", employeeData.employee_id);

        if (wageError) {
          console.error("Error deleting wage:", wageError);
          setError(`Failed to delete wage records: ${wageError.message}`);
          return;
        } else {
          console.log("Wage records deleted successfully");
        }

        // Delete assignments (server assignments to events)
        console.log("Deleting assignments...");
        const { error: assignmentsError } = await supabase
          .from("assignments")
          .delete()
          .eq("employee_id", employeeData.employee_id);

        if (assignmentsError) {
          console.error("Error deleting assignments:", assignmentsError);
          setError(`Failed to delete assignments: ${assignmentsError.message}`);
          return;
        } else {
          console.log("Assignments deleted successfully");
        }

        // Delete truck assignments (where employee is a driver)
        console.log("Deleting truck assignments...");
        const { error: truckAssignmentsError } = await supabase
          .from("truck_assignment")
          .delete()
          .eq("driver_id", employeeData.employee_id);

        if (truckAssignmentsError) {
          console.error(
            "Error deleting truck assignments:",
            truckAssignmentsError
          );
          setError(
            `Failed to delete truck assignments: ${truckAssignmentsError.message}`
          );
          return;
        } else {
          console.log("Truck assignments deleted successfully");
        }

        // Delete time off requests
        console.log("Deleting time off requests...");
        const { error: timeOffError } = await supabase
          .from("time_off_request")
          .delete()
          .eq("employee_id", employeeData.employee_id);

        if (timeOffError) {
          console.error("Error deleting time off requests:", timeOffError);
          setError(
            `Failed to delete time off requests: ${timeOffError.message}`
          );
          return;
        } else {
          console.log("Time off requests deleted successfully");
        }

        // Delete address if exists
        if (employeeData.address_id) {
          console.log("Deleting address:", employeeData.address_id);
          const { error: addressError } = await supabase
            .from("addresses")
            .delete()
            .eq("id", employeeData.address_id);

          if (addressError) {
            console.error("Error deleting address:", addressError);
            setError(`Failed to delete address: ${addressError.message}`);
            return;
          } else {
            console.log("Address deleted successfully");
          }
        }
      }

      // Finally delete the employee
      console.log("Deleting employee from database...");
      const { data: deleteResult, error: employeeError } = await supabase
        .from("employees")
        .delete()
        .eq("employee_id", employeeToDelete.employee_id)
        .select();

      console.log("Delete result:", deleteResult);
      console.log("Delete error:", employeeError);

      if (employeeError) {
        console.error("Error deleting employee:", employeeError);
        setError(
          `Failed to delete employee from database: ${employeeError.message}`
        );
        return;
      }

      console.log("Employee deleted successfully from database");

      // Verify the employee was actually deleted
      const { data: verifyEmployee, error: verifyError } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("employee_id", employeeToDelete.employee_id)
        .single();

      if (verifyError && verifyError.code === "PGRST116") {
        console.log(
          "Employee successfully deleted (not found on verification)"
        );
      } else if (verifyEmployee) {
        console.error("Employee still exists after deletion attempt");
        setError(
          "Employee deletion failed - employee still exists in database"
        );
        return;
      }

      // Update local state
      const updatedEmployees = employees.filter(
        (emp) => emp.employee_id !== employeeToDelete.employee_id
      );
      setEmployees(updatedEmployees);
      setFilteredEmployees(updatedEmployees);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      setError(null);
      console.log("Local state updated successfully");
    } catch (error) {
      console.error("Unexpected error deleting employee:", error);
      setError(
        `Failed to delete employee: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  return (
    <div className="employees-page">
      {/* Search Input */}
      <div className="search-input-container">
        <SearchInput
          placeholder="Search employees by name, phone, or role..."
          onSearch={setSearchTerm}
          className="max-w-md"
        />
      </div>

      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid"
      >
        <button
          className={`button employee-filter-all `}
          onClick={() => setActiveFilter("All")}
        >
          All
        </button>
        <button
          className={`button ${getEmployeeRoleFilterColor("Driver", activeFilter === "Driver")}`}
          onClick={() => setActiveFilter("Driver")}
        >
          Drivers
        </button>
        <button
          className={`button ${getEmployeeRoleFilterColor("Server", activeFilter === "Server")}`}
          onClick={() => setActiveFilter("Server")}
        >
          Servers
        </button>
        <button
          className={`button employee-filter-admin `}
          onClick={() => setActiveFilter("Admin")}
        >
          Admins
        </button>
      </TutorialHighlight>

      {/* Sort Toggle - now below filters */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex justify-end">
          <div className="flex items-center gap-2 md:gap-4">
            <span className="font-medium text-primary-dark">Sort by:</span>
            <button
              className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${sortMode === "first" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
              style={{
                backgroundColor:
                  sortMode === "first" ? "var(--primary-dark)" : undefined,
                borderColor:
                  sortMode === "first" ? "var(--primary-dark)" : undefined,
                minWidth: 90,
              }}
              onClick={() => setSortMode("first")}
            >
              First Name
            </button>
            <button
              className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${sortMode === "last" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
              style={{
                backgroundColor:
                  sortMode === "last" ? "var(--primary-dark)" : undefined,
                borderColor:
                  sortMode === "last" ? "var(--primary-dark)" : undefined,
                minWidth: 90,
              }}
              onClick={() => setSortMode("last")}
            >
              Last Name
            </button>
          </div>
        </div>
        {/* Active/Inactive Toggle - Admin Only */}
        {isAdmin && (
          <div className="flex justify-end my-4 mb-8">
            <div className="flex items-center gap-2 md:gap-4">
              <span className="font-medium text-primary-dark">Show:</span>
              <button
                className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${activeStatus === "active" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
                style={{
                  backgroundColor:
                    activeStatus === "active"
                      ? "var(--primary-dark)"
                      : undefined,
                  borderColor:
                    activeStatus === "active"
                      ? "var(--primary-dark)"
                      : undefined,
                  minWidth: 90,
                }}
                onClick={() => setActiveStatus("active")}
              >
                Active
              </button>
              <button
                className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${activeStatus === "inactive" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
                style={{
                  backgroundColor:
                    activeStatus === "inactive"
                      ? "var(--primary-dark)"
                      : undefined,
                  borderColor:
                    activeStatus === "inactive"
                      ? "var(--primary-dark)"
                      : undefined,
                  minWidth: 90,
                }}
                onClick={() => setActiveStatus("inactive")}
              >
                Inactive
              </button>
            </div>
          </div>
        )}
        <div className="h-.5"></div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {searchTerm.trim() || activeFilter !== "All" ? (
          <span>
            Showing {filteredEmployees.length} of {employees.length} employees
            {searchTerm.trim() && ` matching "${searchTerm}"`}
            {activeFilter !== "All" && ` in ${activeFilter} category`}
          </span>
        ) : (
          <span>Showing all {employees.length} employees</span>
        )}
      </div>

      {/* Employee List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".employee-list")}
        className="employee-list grid gap-4"
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee, index) => {
            // Highlight for "Employee Actions" step (all cards)
            const highlightEmployeeCard =
              shouldHighlight(".employee-card") ||
              shouldHighlight(`.employee-card:nth-child(${index + 1})`);

            // Highlight for "Edit Employee Details" step (first card)
            const highlightEditButton =
              (index === 0 &&
                (shouldHighlight(
                  ".employee-card:first-child button[title='Edit Employee']"
                ) ||
                  shouldHighlight(
                    `.employee-card:nth-child(1) button[title='Edit Employee']`
                  ))) ||
              false;

            // Highlight for "Delete Employee Button" step (first card)
            const highlightDeleteButton =
              (index === 0 &&
                (shouldHighlight("button[onClick*='setShowDeleteModal']") ||
                  shouldHighlight(
                    `.employee-card:nth-child(1) button[title='Delete Employee']`
                  ))) ||
              false;

            return (
              <TutorialHighlight
                key={employee.employee_id}
                isHighlighted={highlightEmployeeCard}
                className={`employee-card bg-white p-4 rounded shadow relative role-${(employee.employee_type || "unknown").toLowerCase()}`}
              >
                {/* Action Buttons */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-4">
                    <TutorialHighlight isHighlighted={highlightEditButton}>
                      <button
                        className="edit-button"
                        onClick={() =>
                          router.push(`/employees/${employee.employee_id}`)
                        }
                        title="Edit Employee"
                      >
                        ✏️
                      </button>
                    </TutorialHighlight>
                    {employee.is_available === false && (
                      <TutorialHighlight isHighlighted={highlightDeleteButton}>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(employee)}
                          title="Delete Employee"
                        >
                          🗑️
                        </button>
                      </TutorialHighlight>
                    )}
                  </div>
                )}

                <h3 className="text-lg font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p>
                  <strong>Role:</strong> {employee.employee_type}
                </p>
                {isAdmin && (
                  <p>
                    <strong>Address:</strong> {employee.addresses?.street},{" "}
                    {employee.addresses?.city}, {employee.addresses?.province}
                  </p>
                )}

                <p>
                  <strong>Phone:</strong> {employee.user_phone}
                </p>
                {isAdmin && (
                  <p>
                    <strong>Wage:</strong> ${employee.currentWage || 0}/hr
                  </p>
                )}
                {isAdmin && (
                  <p>
                    <strong>Status:</strong>{" "}
                    {employee.status ? (
                      <span
                        className={
                          employee.status === "Active"
                            ? "text-green-500"
                            : employee.status === "Inactive"
                              ? "text-red-500"
                              : "text-gray-500"
                        }
                      >
                        {employee.status}
                      </span>
                    ) : (
                      <span
                        className={
                          employee.is_available
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {employee.is_available ? "Available" : "Unavailable"}
                      </span>
                    )}
                  </p>
                )}
                {isAdmin && (
                  <div>
                    <p>
                      <strong>Availability:</strong>
                    </p>
                    <div
                      className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded"
                      style={{ maxWidth: "100%", wordWrap: "break-word" }}
                    >
                      {employee.availability &&
                      employee.availability.length > 0 ? (
                        <div className="space-y-1">
                          {employee.availability
                            .sort((a, b) => {
                              const dayOrder = [
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                                "Sunday",
                              ];
                              return (
                                dayOrder.indexOf(a.day_of_week) -
                                dayOrder.indexOf(b.day_of_week)
                              );
                            })
                            .map((avail, index) => {
                              const startTime = avail.start_time.slice(0, 5); // Remove seconds
                              const endTime = avail.end_time.slice(0, 5); // Remove seconds
                              return (
                                <div
                                  key={index}
                                  className="flex justify-between"
                                >
                                  <span className="font-medium">
                                    {avail.day_of_week}:
                                  </span>
                                  <span>
                                    {startTime} - {endTime}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">
                          No availability set
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </TutorialHighlight>
            );
          })
        ) : (
          <p className="text-gray-500">No employees found.</p>
        )}
      </TutorialHighlight>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete{" "}
              <strong>
                {employeeToDelete.first_name} {employeeToDelete.last_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="button bg-gray-300 text-gray-700"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="button bg-red-500 text-white"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
