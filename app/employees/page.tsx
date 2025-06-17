"use client";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/app/types";
import { createClient } from "@/lib/supabase/client";

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
            user_phone
          `
          )
          .neq("employee_type", "pending")
          .neq("employee_type", "admin");

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

        // Get wage information
        const { data: wageData } = await supabase
          .from("wage")
          .select("*")
          .in(
            "employee_id",
            data.map((emp) => emp.employee_id)
          );

        const formattedEmployees = data.map((emp) => {
          const address = addressesData?.find(
            (addr) => addr.id === emp.address_id
          );
          const wage = wageData?.find((w) => w.employee_id === emp.employee_id);

          return {
            id: emp.employee_id,
            first_name: emp.first_name || "",
            last_name: emp.last_name || "",
            address: address
              ? `${address.street}, ${address.city}, ${address.province}`
              : "",
            role: emp.employee_type || "",
            email: emp.user_email || "",
            phone: emp.user_phone || "",
            wage: wage?.hourly_wage || 0,
            isAvailable: emp.is_available || false,
            availability: emp.availability || [],
          };
        });

        setEmployees(formattedEmployees);
        setFilteredEmployees(formattedEmployees);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchEmployees();
  }, []);

  // Filter employees based on the active filter
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter((employee) => employee.role === activeFilter)
      );
    }
  }, [activeFilter, employees]);

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      // Get current employees
      const response = await fetch("/employees.json");
      const currentEmployees = await response.json();

      // Filter out the employee to delete
      const updatedEmployees = currentEmployees.filter(
        (emp: Employee) => emp.id !== employeeToDelete.id
      );

      // Save updated list
      const saveResponse = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEmployees),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to delete employee");
      }

      // Update local state
      setEmployees(updatedEmployees);
      setFilteredEmployees(updatedEmployees);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
    }
  };

  return (
    <div className="employees-page">
      <h2 className="text-2xl mb-4">Employee Management</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons grid">
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
      </div>

      {/* Employee List */}
      <div className="employee-list grid gap-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="employee-card bg-white p-4 rounded shadow relative"
            >
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-4">
                <button
                  className="edit-button"
                  onClick={() => router.push(`/employees/${employee.id}`)}
                  title="Edit Employee"
                >
                  ✏️
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteClick(employee)}
                  title="Delete Employee"
                >
                  🗑️
                </button>
              </div>

              <h3 className="text-lg font-semibold">
                {employee.first_name}
                {employee.last_name}
              </h3>
              <p>
                <strong>Role:</strong> {employee.role}
              </p>
              <p>
                <strong>Address:</strong> {employee.address}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${employee.email}`} className="text-blue-500">
                  {employee.email}
                </a>
              </p>
              <p>
                <strong>Phone:</strong> {employee.phone}
              </p>
              <p>
                <strong>Wage:</strong> ${employee.wage}/hr
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    employee.isAvailable ? "text-green-500" : "text-red-500"
                  }
                >
                  {employee.isAvailable ? "Available" : "Unavailable"}
                </span>
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {employee.availability && employee.availability.length > 0 ? (
                  <span className="text-primary-medium">
                    {employee.availability.join(", ")}
                  </span>
                ) : (
                  <span className="text-gray-500">Not available</span>
                )}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No employees found.</p>
        )}
      </div>

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
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              padding: "2.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 400,
              border: "4px solid #ef4444",
              fontFamily: "sans-serif",
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              ⚠️
            </span>
            <p
              style={{
                color: "#b91c1c",
                fontWeight: 800,
                fontSize: "1.25rem",
                marginBottom: "1rem",
                textAlign: "center",
                letterSpacing: "0.03em",
              }}
            >
              Confirm Delete
            </p>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1.5rem",
                color: "#4b5563",
                fontSize: "1rem",
              }}
            >
              Are you sure you want to delete {employeeToDelete.first_name}
              {employeeToDelete.last_name}? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "#e5e7eb",
                  color: "#4b5563",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s",
                }}
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#d1d5db")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "#ef4444",
                  color: "white",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.15)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s",
                }}
                onClick={handleDeleteConfirm}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#dc2626")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#ef4444")
                }
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
