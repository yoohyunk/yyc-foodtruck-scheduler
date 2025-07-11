import React from "react";
import {
  Employee,
  Truck,
  TruckAssignment,
  getTruckBorderColor,
} from "@/app/types";
import { useRouter } from "next/navigation";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { extractTime } from "../../utils";

interface TruckAssignmentsSectionProps {
  truckAssignments: TruckAssignment[];
  trucks: Truck[];
  employees: Employee[];
  shouldHighlight?: (selector: string) => boolean;
}

export default function TruckAssignmentsSection({
  truckAssignments,
  trucks,
  employees,
  shouldHighlight = () => false,
}: TruckAssignmentsSectionProps) {
  const router = useRouter();

  const handleTruckClick = (truckId: string) => {
    router.push(`/trucks/${truckId}`);
  };

  const handleDriverClick = (driverId: string) => {
    router.push(`/employees/${driverId}`);
  };

  if (truckAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Truck Assignments
        </h3>
        <p className="text-gray-500">No trucks assigned to this event yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Truck Assignments ({truckAssignments.length})
      </h3>
      <div className="space-y-3">
        {truckAssignments.map((assignment, index) => {
          const truck = trucks.find((t) => t.id === assignment.truck_id);
          const driver = employees.find(
            (e) => e.employee_id === assignment.driver_id
          );

          return (
            <TutorialHighlight
              key={assignment.id}
              isHighlighted={
                index === 0 &&
                shouldHighlight(
                  ".truck-assignments-section .truck-card:first-child"
                )
              }
            >
              <div
                className="border rounded-lg p-4 transition-all duration-200 truck-card hover:shadow-md"
                style={{
                  borderLeft: `6px solid ${getTruckBorderColor(truck?.type || "")}`,
                  borderTop: `4px solid ${getTruckBorderColor(truck?.type || "")}`,
                  background: `linear-gradient(135deg, ${getTruckBorderColor(truck?.type || "")}25 0%, var(--white) 100%)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                      <span className="text-xs font-bold text-gray-700 text-center leading-tight">
                        {truck?.name
                          ?.split(" ")
                          .map((word) => word.charAt(0))
                          .join("")
                          .toUpperCase() || "T"}
                      </span>
                    </div>
                    <div>
                      <TutorialHighlight
                        isHighlighted={
                          index === 0 &&
                          shouldHighlight(
                            ".truck-assignments-section .truck-name:first-child"
                          )
                        }
                      >
                        <h4
                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truck-name"
                          onClick={() => truck && handleTruckClick(truck.id)}
                        >
                          {truck?.name || "Unknown Truck"}
                        </h4>
                      </TutorialHighlight>
                      <p className="text-sm text-gray-500">
                        Type: {truck?.type || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Assigned
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2 text-gray-900">
                        {driver ? (
                          <TutorialHighlight
                            isHighlighted={
                              index === 0 &&
                              shouldHighlight(
                                ".truck-assignments-section .driver-name:first-child"
                              )
                            }
                          >
                            <span
                              className="cursor-pointer hover:text-blue-600 transition-colors underline driver-name"
                              onClick={() =>
                                handleDriverClick(driver.employee_id)
                              }
                            >
                              {driver.first_name} {driver.last_name}
                            </span>
                          </TutorialHighlight>
                        ) : (
                          "No driver assigned"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Time:</span>
                      <span className="ml-2 text-gray-900">
                        {extractTime(assignment.start_time)} -{" "}
                        {extractTime(assignment.end_time)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TutorialHighlight>
          );
        })}
      </div>
    </div>
  );
}
