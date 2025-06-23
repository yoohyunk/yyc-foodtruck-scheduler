import React from "react";
import { Employee, Truck, TruckAssignment } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { extractTime } from "../../utils";

interface TruckAssignmentsSectionProps {
  truckAssignments: TruckAssignment[];
  trucks: Truck[];
  employees: Employee[];
  shouldHighlight: (selector: string) => boolean;
}

export default function TruckAssignmentsSection({
  truckAssignments,
  trucks,
  employees,
  shouldHighlight,
}: TruckAssignmentsSectionProps) {
  if (truckAssignments.length === 0) return null;

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".truck-assignments-section")}
      className="assigned-section truck-assignments-section mt-8 w-full"
    >
      <h2 className="assigned-section-title">Truck Assignments</h2>
      <div className="assigned-grid">
        {truckAssignments.map((assignment) => {
          const truck = trucks.find((t) => t.id === assignment.truck_id);
          const driver = employees.find(
            (e) => e.employee_id === assignment.driver_id
          );

          return (
            <div key={assignment.id} className="truck-card">
              <h3 className="truck-title">{truck?.name || "Unknown Truck"}</h3>
              <p className="truck-info">Type: {truck?.type || "Unknown"}</p>
              <p className="truck-info">
                Driver:{" "}
                {driver
                  ? `${driver.first_name} ${driver.last_name}`
                  : "No driver assigned"}
              </p>
              <p className="truck-info text-sm text-gray-600">
                Start: {extractTime(assignment.start_time)}
              </p>
              <p className="truck-info text-sm text-gray-600">
                End: {extractTime(assignment.end_time)}
              </p>
            </div>
          );
        })}
      </div>
    </TutorialHighlight>
  );
}
