"use client";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/app/types";
import { createClient } from "@/lib/supabase/client";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";

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

        // Get wage information - first check if there are any wages at all
        const { data: allWagesCheck, error: wageCheckError } = await supabase
          .from("wage")
          .select("*");

        console.log("All wages in database:", allWagesCheck);
        console.log("Wage check error:", wageCheckError);

        // Get wage information - get all wages and find the most recent one for each employee
        console.log(
          "Employee IDs to fetch wages for:",
          data.map((emp) => emp.employee_id)
        );

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

        console.log("All wages fetched:", allWages);
        console.log("Wage error:", wageError);

        // Create a map of employee_id to their most recent wage
        const wageMap = new Map();
        if (allWages) {
          allWages.forEach((wage) => {
            console.log(
              `Processing wage for employee ${wage.employee_id}:`,
              wage
            );
            if (!wageMap.has(wage.employee_id)) {
              wageMap.set(wage.employee_id, wage);
            }
          });
        }

        console.log("Final wage map:", wageMap);
        console.log("Wage map entries:", Array.from(wageMap.entries()));

        const formattedEmployees = data.map((emp) => {
          const address = addressesData?.find(
            (addr) => addr.id === emp.address_id
          );
          const wage = wageMap.get(emp.employee_id);

          console.log(`Employee ${emp.employee_id} - found wage:`, wage);
          console.log(
            `Employee ${emp.employee_id} - wage hourly_wage:`,
            wage?.hourly_wage
          );

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

        setEmployees(formattedEmployees as Employee[]);
        setFilteredEmployees(formattedEmployees as Employee[]);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchEmployees();
  }, [supabase]);

  // Filter employees based on the active filter
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter((employee) => employee.employee_type === activeFilter)
      );
    }
  }, [activeFilter, employees]);

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    console.log("Attempting to delete employee:", employeeToDelete);

    try {
      // First, get the employee data to find related records
      const { data: employeeData, error: fetchError } = await supabase
        .from("employees")
        .select("employee_id, address_id")
        .eq("employee_id", employeeToDelete.employee_id)
        .single();

      if (fetchError) {
        console.error("Error fetching employee data:", fetchError);
        alert("Failed to fetch employee data for deletion.");
        return;
      }

      console.log("Employee data for deletion:", employeeData);

      // Delete wage records
      if (employeeData) {
        const { error: wageError } = await supabase
          .from("wage")
          .delete()
          .eq("employee_id", employeeData.employee_id);

        if (wageError) {
          console.error("Error deleting wage:", wageError);
        } else {
          console.log("Wage records deleted");
        }

        // Delete address if exists
        if (employeeData.address_id) {
          const { error: addressError } = await supabase
            .from("addresses")
            .delete()
            .eq("id", employeeData.address_id);

          if (addressError) {
            console.error("Error deleting address:", addressError);
          } else {
            console.log("Address deleted");
          }
        }
      }

      // Finally delete the employee
      const { error: employeeError } = await supabase
        .from("employees")
        .delete()
        .eq("employee_id", employeeToDelete.employee_id);

      console.log("Delete result:", { error: employeeError });

      if (employeeError) {
        console.error("Error deleting employee:", employeeError);
        alert("Failed to delete employee from database.");
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

      console.log("Employee and all related data deleted successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
    }
  };

  return (
    <div className="employees-page">
      <h2 className="text-2xl mb-4">Employee Management</h2>

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
                  <TutorialHighlight isHighlighted={highlightDeleteButton}>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(employee)}
                      title="Delete Employee"
                    >
                      🗑️
                    </button>
                  </TutorialHighlight>
                </div>

                <h3 className="text-lg font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p>
                  <strong>Role:</strong> {employee.employee_type}
                </p>
                <p>
                  <strong>Address:</strong> {employee.addresses?.street},{" "}
                  {employee.addresses?.city}, {employee.addresses?.province}
                </p>
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
                <p>
                  <strong>Wage:</strong> ${employee.currentWage || 0}/hr
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      employee.is_available ? "text-green-500" : "text-red-500"
                    }
                  >
                    {employee.is_available ? "Available" : "Unavailable"}
                  </span>
                </p>
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
