"use client";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Employee } from "@/app/types";
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
  const { shouldHighlight } = useTutorial();

  // Fetch employees from employee.json
  useEffect(() => {
    fetch("/employees.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Employee[]) => {
        setEmployees(data);
        setFilteredEmployees(data);
      })
      .catch(() => {
        setEmployees([]);
        setFilteredEmployees([]);
      });
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
    } catch {
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
                key={employee.id}
                isHighlighted={highlightEmployeeCard}
                className="employee-card bg-white p-4 rounded shadow relative"
              >
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-4">
                  <TutorialHighlight isHighlighted={highlightEditButton}>
                    <button
                      className="edit-button"
                      onClick={() => router.push(`/employees/${employee.id}`)}
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
                  <a
                    href={`mailto:${employee.email}`}
                    className="text-blue-500"
                  >
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
