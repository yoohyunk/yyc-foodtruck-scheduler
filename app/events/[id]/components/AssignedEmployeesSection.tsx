import React from "react";
import { Employee } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";

interface AssignedEmployeesSectionProps {
  assignedEmployees: Employee[];
  shouldHighlight: (selector: string) => boolean;
}

export default function AssignedEmployeesSection({
  assignedEmployees,
  shouldHighlight,
}: AssignedEmployeesSectionProps) {
  if (assignedEmployees.length === 0) return null;

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".assigned-employees-section")}
      className="assigned-section assigned-employees-section mt-8 w-full"
    >
      <h2 className="assigned-section-title">Assigned Employees</h2>
      <div className="assigned-grid">
        {assignedEmployees.map((employee) => (
          <div key={employee.employee_id} className="employee-card">
            <h3 className="employee-name">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="employee-role">
              Role: {employee.employee_type || "Unknown"}
            </p>
          </div>
        ))}
      </div>
    </TutorialHighlight>
  );
}
