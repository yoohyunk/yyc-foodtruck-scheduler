import React, { useState, useEffect } from "react";
import { Employee, Truck, TruckAssignment, getTruckTypeColor, getTruckTypeBadge } from "@/app/types";
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
  eventStartTime?: string;
  eventEndTime?: string;
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
  eventStartTime,
  eventEndTime,
}: TruckAssignmentModalProps) {
  const [selectedTrucks, setSelectedTrucks] = useState<Set<string>>(new Set());
  const [driverAssignments, setDriverAssignments] = useState<
    Map<string, string>
  >(new Map());

  // Initialize selected trucks and driver assignments when modal opens
  useEffect(() => {
    if (isOpen) {
      const newSelectedTrucks = new Set<string>();
      const newDriverAssignments = new Map<string, string>();

      trucks.forEach((truck) => {
        const assignedDriver = getAssignedDriverForTruck(truck.id);
        if (assignedDriver) {
          newSelectedTrucks.add(truck.id);
          newDriverAssignments.set(truck.id, assignedDriver.employee_id);
        }
      });

      setSelectedTrucks(newSelectedTrucks);
      setDriverAssignments(newDriverAssignments);
    }
  }, [isOpen, trucks, getAssignedDriverForTruck]);

  if (!isOpen) return null;

  const handleTruckSelection = (truckId: string, isSelected: boolean) => {
    const newSelectedTrucks = new Set(selectedTrucks);

    if (isSelected) {
      newSelectedTrucks.add(truckId);
    } else {
      newSelectedTrucks.delete(truckId);
      // Remove driver assignment when truck is deselected
      const newDriverAssignments = new Map(driverAssignments);
      newDriverAssignments.delete(truckId);
      setDriverAssignments(newDriverAssignments);
    }

    setSelectedTrucks(newSelectedTrucks);
  };

  const handleDriverAssignment = (truckId: string, driverId: string | null) => {
    const newDriverAssignments = new Map(driverAssignments);

    if (driverId) {
      newDriverAssignments.set(truckId, driverId);
    } else {
      newDriverAssignments.delete(truckId);
    }

    setDriverAssignments(newDriverAssignments);
    // Don't call onTruckAssignment here - wait for Save button
  };

  const handleSaveAssignments = () => {
    // Process all selected trucks and their driver assignments
    selectedTrucks.forEach((truckId) => {
      const driverId = driverAssignments.get(truckId) || null;
      onTruckAssignment(truckId, driverId);
    });
    onClose();
  };

  const availableDrivers = getAvailableDrivers();

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-4xl">
        <h3 className="modal-title">Assign Trucks & Drivers</h3>
        <div className="modal-body">
          {isLoadingTrucks ? (
            <p className="text-gray-500">Loading trucks...</p>
          ) : trucks.length > 0 ? (
            <div className="space-y-4">
              {trucks.map((truck, index) => {
                const isSelected = selectedTrucks.has(truck.id);
                const assignedDriver = getAssignedDriverForTruck(truck.id);
                const selectedDriverId = driverAssignments.get(truck.id) || assignedDriver?.employee_id || "";

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
                    <div className={`truck-assignment border rounded-lg p-4 ${getTruckTypeColor(truck.type)}`}>
                      {/* Truck Selection Checkbox */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id={`truck-${truck.id}`}
                            checked={isSelected}
                            onChange={(e) => handleTruckSelection(truck.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label 
                            htmlFor={`truck-${truck.id}`}
                            className="font-semibold text-lg cursor-pointer"
                          >
                            {truck.name}
                          </label>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTruckTypeBadge(truck.type)}`}>
                            {truck.type}
                          </span>
                        </div>
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

                      {/* Driver Assignment Section - Only show if truck is selected */}
                      {isSelected && (
                        <div className="space-y-2 mt-4 p-3 bg-white rounded border">
                          <label className="block text-sm font-medium text-gray-700">
                            Assign Driver:
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedDriverId}
                            onChange={(e) =>
                              handleDriverAssignment(
                                truck.id,
                                e.target.value || null
                              )
                            }
                          >
                            <option value="">No driver assigned</option>
                            {availableDrivers.map((driver) => (
                              <option
                                key={driver.employee_id}
                                value={driver.employee_id}
                              >
                                {driver.first_name} {driver.last_name} (
                                {driver.employee_type})
                              </option>
                            ))}
                          </select>

                          {selectedDriverId && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-sm text-blue-800">
                                <strong>Assigned Driver:</strong>{" "}
                                {
                                  availableDrivers.find(
                                    (d) => d.employee_id === selectedDriverId
                                  )?.first_name
                                }{" "}
                                {
                                  availableDrivers.find(
                                    (d) => d.employee_id === selectedDriverId
                                  )?.last_name
                                }
                              </p>
                            </div>
                          )}

                          {/* Event Time Information */}
                          {eventStartTime && eventEndTime && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm text-gray-600">
                                <strong>Event Time:</strong> {eventStartTime} -{" "}
                                {eventEndTime}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
              Cancel
            </button>
          </TutorialHighlight>
          <button
            className="btn-primary"
            onClick={handleSaveAssignments}
            disabled={selectedTrucks.size === 0}
          >
            Save Assignments ({selectedTrucks.size} truck
            {selectedTrucks.size !== 1 ? "s" : ""} selected)
          </button>
        </div>
      </div>
    </div>
  );
}
