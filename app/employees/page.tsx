"use client";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/app/types";
import { createClient } from "@/lib/supabase/client";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";

export default function Employees(): ReactElement {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const router = useRouter();
  const supabase = createClient();
  const { shouldHighlight } = useTutorial();
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"last" | "first">("last");
  const [activeStatus, setActiveStatus] = useState<"active" | "inactive">(
    "active"
  );
  const { isAdmin } = useAuth();

  // Fetch employees from employee.json
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select(
            `
            employee_id,
            first_name,
            last_name,
            employee_type,
            is_available,
            availability,
            address_id,
            user_id,
            user_email,
            user_phone,
            created_at,
            is_pending
          `
          )
          .neq("employee_type", "pending");

        if (error) {
          console.error("Error fetching employees:", error);
          return;
        }

        if (!data) {
          console.log("No data returned");
          return;
        }

        // Get addresses for the employees
        const addressIds = data.map((emp) => emp.address_id).filter(Boolean);
        const { data: addressesData } = await supabase
          .from("addresses")
          .select("*")
          .in("id", addressIds);

        // Get wage information - get all wages and find the most recent one for each employee
        const { data: allWages, error: wageError } = await supabase
          .from("wage")
          .select("*")
          .in(
            "employee_id",
            data.map((emp) => emp.employee_id)
          )
          .order("start_date", { ascending: false });

        if (wageError) {
          console.error("Error fetching wages:", wageError);
        }

        // Create a map of employee_id to their most recent wage
        const wageMap = new Map();
        if (allWages) {
          allWages.forEach((wage) => {
            if (!wageMap.has(wage.employee_id)) {
              wageMap.set(wage.employee_id, wage);
            }
          });
        }

        const formattedEmployees = data.map((emp) => {
          const address = addressesData?.find(
            (addr) => addr.id === emp.address_id
          );
          const wage = wageMap.get(emp.employee_id);

          return {
            ...emp,
            created_at: emp.created_at || new Date().toISOString(),
            is_pending: emp.is_pending || false,
            addresses: address
              ? {
                  id: address.id,
                  street: address.street,
                  city: address.city,
                  province: address.province,
                  postal_code: address.postal_code,
                  country: address.country,
                  latitude: address.latitude,
                  longitude: address.longitude,
                  created_at: address.created_at,
                }
              : undefined,
            currentWage: wage?.hourly_wage || 0,
          };
        });

        // Filter employees by activeStatus
        const statusEmployees = formattedEmployees.filter((emp) =>
          activeStatus === "active" ? emp.is_available : !emp.is_available
        );
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

        setEmployees(sortedEmployees as Employee[]);
        setFilteredEmployees(sortedEmployees as Employee[]);
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
  }, [supabase, sortMode, activeStatus]);

  // Filter employees based on the active filter and activeStatus
  useEffect(() => {
    let filtered = employees;
    if (activeFilter !== "All") {
      filtered = filtered.filter(
        (employee) => employee.employee_type === activeFilter
      );
    }
    setFilteredEmployees(filtered);
  }, [activeFilter, employees]);

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

  const handleDeleteClick = (employee: Employee) => {
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
      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid"
      >
        <button
          className={`button ${activeFilter === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("All")}
        >
          All
        </button>
        <button
          className={`button ${activeFilter === "Driver" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Driver")}
        >
          Drivers
        </button>
        <button
          className={`button ${activeFilter === "Server" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Server")}
        >
          Servers
        </button>
        <button
          className={`button ${activeFilter === "Admin" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
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
                className="employee-card bg-white p-4 rounded shadow relative"
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
                {isAdmin && (
                  <p>
                    <strong>Role:</strong> {employee.employee_type}
                  </p>
                )}
                {isAdmin && (
                  <p>
                    <strong>Address:</strong> {employee.addresses?.street},{" "}
                    {employee.addresses?.city}, {employee.addresses?.province}
                  </p>
                )}
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${employee.user_email}`}
                    className="text-blue-500"
                  >
                    {employee.user_email}
                  </a>
                </p>
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
                    <span
                      className={
                        employee.is_available
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    >
                      {employee.is_available ? "Available" : "Unavailable"}
                    </span>
                  </p>
                )}
                {isAdmin && (
                  <p>
                    <strong>Availability:</strong>{" "}
                    {Array.isArray(employee.availability) &&
                    employee.availability.length > 0 ? (
                      <span className="text-primary-medium">
                        {employee.availability.join(", ")}
                      </span>
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </p>
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
