import React, { useState } from "react";
import {
  Employee,
  Truck,
  TruckAssignment as BaseTruckAssignment,
  getTruckBorderColor,
} from "@/app/types";
import { useRouter } from "next/navigation";
import { TutorialHighlight } from "../../../components/TutorialHighlight";
import { extractTime } from "../../utils";
import { truckAssignmentsApi } from "@/lib/supabase/events";
import ErrorModal from "../../../components/ErrorModal";

// Extend TruckAssignment to support joined data
interface TruckAssignment extends BaseTruckAssignment {
  trucks?: Truck;
  employees?: Employee;
}

interface TruckAssignmentsSectionProps {
  truckAssignments: TruckAssignment[];
  trucks: Truck[];
  employees: Employee[];
  shouldHighlight?: (selector: string) => boolean;
  onAssignmentRemoved?: () => void;
  isAdmin?: boolean;
}

export default function TruckAssignmentsSection({
  truckAssignments,
  trucks,
  employees,
  shouldHighlight = () => false,
  onAssignmentRemoved,
  isAdmin = false,
}: TruckAssignmentsSectionProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<{
    id: string;
    truckName: string;
    driverName: string;
  } | null>(null);

  // Debug: log truckAssignments for non-admins
  if (!isAdmin) {
    console.log(
      "[TruckAssignmentsSection] Non-admin truckAssignments:",
      truckAssignments
    );
  }

  const handleTruckClick = (truckId: string) => {
    router.push(`/trucks/${truckId}`);
  };

  const handleDriverClick = (driverId: string) => {
    router.push(`/employees/${driverId}`);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setRemovingId(assignmentId);
    try {
      await truckAssignmentsApi.deleteTruckAssignment(assignmentId);
      if (onAssignmentRemoved) {
        await onAssignmentRemoved();
      }
    } catch (err) {
      console.error("Failed to unassign truck:", err);
      alert("Failed to unassign truck.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUnassignClick = (assignment: TruckAssignment) => {
    const truck = trucks.find((t) => t.id === assignment.truck_id);
    const driver = employees.find(
      (e) => e.employee_id === assignment.driver_id
    );
    setAssignmentToRemove({
      id: assignment.id,
      truckName: truck?.name || "Unknown Truck",
      driverName: driver
        ? `${driver.first_name || ""} ${driver.last_name || ""}`.trim()
        : "No driver assigned",
    });
    setShowConfirmModal(true);
  };

  const handleConfirmUnassign = async () => {
    if (!assignmentToRemove) return;
    await handleRemoveAssignment(assignmentToRemove.id);
    setShowConfirmModal(false);
    setAssignmentToRemove(null);
  };

  const handleCancelUnassign = () => {
    setShowConfirmModal(false);
    setAssignmentToRemove(null);
  };

  if (truckAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Truck Assignments
        </h3>
        <p className="text-gray-500">
          No trucks assigned to this event yet. Trucks are optional for events.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Truck Assignments ({truckAssignments.length})
        </h3>
        <div className="space-y-3">
          {truckAssignments.map((assignment, index) => {
            // Prefer joined data for non-admins
            const truck =
              assignment.trucks ||
              trucks.find((t) => t.id === assignment.truck_id);
            const driver =
              assignment.employees ||
              employees.find((e) => e.employee_id === assignment.driver_id);
            // Debug: log each assignment's truck and driver for non-admins
            if (!isAdmin) {
              console.log(
                `[TruckAssignmentsSection] Assignment ${assignment.id} truck:`,
                truck,
                "driver:",
                driver
              );
            }

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
                            .map((word: string) => word.charAt(0))
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
                            className={`font-medium text-gray-900 truck-name${isAdmin ? " cursor-pointer hover:text-blue-600 transition-colors" : ""}`}
                            onClick={
                              isAdmin && truck
                                ? () => handleTruckClick(truck.id)
                                : undefined
                            }
                            style={
                              !isAdmin
                                ? { pointerEvents: "none", opacity: 0.8 }
                                : {}
                            }
                          >
                            {truck?.name || "Unknown Truck"}
                          </h4>
                        </TutorialHighlight>
                        <span className="text-sm text-gray-500">
                          Type: {truck?.type || "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Assigned
                      </span>
                      {isAdmin && (
                        <button
                          className="p-1 rounded hover:bg-red-100 text-red-600 flex items-center justify-center transition-all duration-200 hover:scale-110"
                          title="Unassign"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassignClick(assignment);
                          }}
                          disabled={removingId === assignment.id}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
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
                                className={`driver-name${isAdmin ? " cursor-pointer hover:text-blue-600 transition-colors underline" : ""}`}
                                onClick={
                                  isAdmin && driver && driver.employee_id
                                    ? () =>
                                        handleDriverClick(driver.employee_id)
                                    : undefined
                                }
                                style={
                                  !isAdmin
                                    ? { pointerEvents: "none", opacity: 0.8 }
                                    : {}
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
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ErrorModal
          isOpen={showConfirmModal}
          onClose={handleCancelUnassign}
          errors={[
            {
              field: "general",
              message: `Are you sure you want to unassign ${assignmentToRemove?.truckName} (${assignmentToRemove?.driverName}) from this event?`,
            },
          ]}
          type="confirmation"
          title="Confirm Unassignment"
          onConfirm={handleConfirmUnassign}
          confirmText="Unassign"
          cancelText="Cancel"
        />
      )}
    </>
  );
}
