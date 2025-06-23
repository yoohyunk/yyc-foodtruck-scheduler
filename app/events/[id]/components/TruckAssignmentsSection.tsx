import React from "react";
import { Employee, Truck, TruckAssignment, getTruckTypeColor, getTruckTypeBadge } from "@/app/types";
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
            <div 
              key={assignment.id} 
              className={`truck-card border rounded-lg p-4 ${getTruckTypeColor(truck?.type || "")}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="truck-title font-semibold text-lg">{truck?.name || "Unknown Truck"}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTruckTypeBadge(truck?.type || "")}`}>
                  {truck?.type || "Unknown"}
                </span>
              </div>
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
