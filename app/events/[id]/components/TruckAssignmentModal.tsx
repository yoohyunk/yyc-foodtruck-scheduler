import React from "react";
import { Employee, Truck } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";

interface TruckAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trucks: Truck[];
  isLoadingTrucks: boolean;
  onTruckAssignment: (truckId: string, driverId: string | null) => void;
  getAssignedDriverForTruck: (truckId: string) => Employee | null;
  getAvailableDrivers: () => Employee[];
  shouldHighlight: (selector: string) => boolean;
}

export default function TruckAssignmentModal({
  isOpen,
  onClose,
  trucks,
  isLoadingTrucks,
  onTruckAssignment,
  getAssignedDriverForTruck,
  getAvailableDrivers,
  shouldHighlight,
}: TruckAssignmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title">Assign Trucks & Drivers</h3>
        <div className="modal-body">
          {isLoadingTrucks ? (
            <p className="text-gray-500">Loading trucks...</p>
          ) : trucks.length > 0 ? (
            <div className="space-y-4">
              {trucks.map((truck, index) => {
                const assignedDriver = getAssignedDriverForTruck(truck.id);
                const availableDrivers = getAvailableDrivers();

                return (
                  <TutorialHighlight
                    key={truck.id}
                    isHighlighted={
                      index === 0 &&
                      shouldHighlight(
                        ".modal-body .truck-assignment:first-child"
                      )
                    }
                  >
                    <div className="truck-assignment border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">
                          {truck.name} ({truck.type})
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            truck.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {truck.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Assign Driver:
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={assignedDriver?.employee_id || ""}
                          onChange={(e) =>
                            onTruckAssignment(truck.id, e.target.value || null)
                          }
                        >
                          <option value="">No driver assigned</option>
                          {availableDrivers.map((driver) => (
                            <option
                              key={driver.employee_id}
                              value={driver.employee_id}
                            >
                              {driver.first_name} {driver.last_name}
                            </option>
                          ))}
                        </select>

                        {assignedDriver && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                              <strong>Assigned Driver:</strong>{" "}
                              {assignedDriver.first_name}{" "}
                              {assignedDriver.last_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TutorialHighlight>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No trucks available.</p>
          )}
        </div>
        <div className="modal-footer">
          <TutorialHighlight
            isHighlighted={shouldHighlight(
              ".modal-footer button.btn-secondary"
            )}
          >
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </TutorialHighlight>
          <button className="btn-primary" onClick={onClose}>
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
}
