import React, { useState, useEffect, useMemo } from "react";
import { Employee, Truck, getTruckBorderColor } from "@/app/types";
import { TutorialHighlight } from "../../../components/TutorialHighlight";

interface TruckWithAssignment extends Truck {
  selectedDriverId?: string;
}

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

// Memoized truck item component to prevent unnecessary re-renders
const TruckItem = React.memo(
  ({
    truck,
    isSelected,
    selectedDriverId,
    onTruckSelection,
    onDriverAssignment,
    shouldHighlight,
    index,
    availableDrivers,
    eventStartTime,
    eventEndTime,
  }: {
    truck: TruckWithAssignment;
    isSelected: boolean;
    selectedDriverId: string;
    onTruckSelection: (truckId: string, isSelected: boolean) => void;
    onDriverAssignment: (truckId: string, driverId: string | null) => void;
    shouldHighlight: (selector: string) => boolean;
    index: number;
    availableDrivers: Employee[];
    eventStartTime?: string;
    eventEndTime?: string;
  }) => (
    <TutorialHighlight
      key={truck.id}
      isHighlighted={
        index === 0 &&
        shouldHighlight(".modal-body .truck-checkbox:first-child")
      }
    >
      <div
        className="truck-assignment border rounded-lg p-4"
        style={{
          borderLeft: `6px solid ${getTruckBorderColor(truck.type)}`,
          borderTop: `4px solid ${getTruckBorderColor(truck.type)}`,
          background: `linear-gradient(135deg, ${getTruckBorderColor(truck.type)}25 0%, var(--white) 100%)`,
        }}
      >
        {/* Truck Selection Section */}
        <label
          className={`truck-label w-full flex items-center justify-between px-0 ${
            isSelected ? "truck-label-selected" : ""
          } cursor-pointer`}
        >
          <div className="flex-grow flex items-center justify-between w-full pl-3 mr-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                <span className="text-xs font-bold text-gray-700 text-center leading-tight">
                  {truck.name
                    ?.split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                    .toUpperCase() || "T"}
                </span>
              </div>
              <div>
                <span
                  className="font-semibold text-lg"
                  style={{ whiteSpace: "nowrap" }}
                >
                  {truck.name}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  (Capacity: {truck.capacity})
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-700 flex items-center justify-end gap-4">
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
          </div>
          <input
            type="checkbox"
            className="truck-checkbox mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={isSelected}
            onChange={(e) => onTruckSelection(truck.id, e.target.checked)}
          />
        </label>

        {/* Driver Assignment Section - Only show if truck is selected */}
        {isSelected && (
          <div className="space-y-2 mt-4 p-3 bg-gray-50 rounded border">
            <label className="block text-sm font-medium text-gray-700">
              Assign Driver:
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedDriverId}
              onChange={(e) =>
                onDriverAssignment(truck.id, e.target.value || null)
              }
            >
              <option value="">No driver assigned</option>
              {availableDrivers.map((driver) => (
                <option key={driver.employee_id} value={driver.employee_id}>
                  {driver.first_name} {driver.last_name} ({driver.employee_type}
                  )
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
                  <strong>Event Time:</strong> {eventStartTime} - {eventEndTime}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </TutorialHighlight>
  )
);

TruckItem.displayName = "TruckItem";

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
  const [truckFilter, setTruckFilter] = useState<string>("all");

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

  const availableDrivers = getAvailableDrivers();

  const filteredTrucks = useMemo(() => {
    return trucks.filter(
      (truck) => truckFilter === "all" || truck.type === truckFilter
    );
  }, [trucks, truckFilter]);

  const trucksWithAssignments = useMemo(() => {
    return filteredTrucks.map((truck) => {
      const assignedDriver = getAssignedDriverForTruck(truck.id);
      const selectedDriverId =
        driverAssignments.get(truck.id) || assignedDriver?.employee_id || "";

      return {
        ...truck,
        selectedDriverId,
      };
    });
  }, [filteredTrucks, driverAssignments, getAssignedDriverForTruck]);

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
  };

  const handleSaveAssignments = () => {
    // Process all selected trucks and their driver assignments
    selectedTrucks.forEach((truckId) => {
      const driverId = driverAssignments.get(truckId) || null;
      onTruckAssignment(truckId, driverId);
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-container"
        style={{
          width: "90vw",
          maxWidth: "950px",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
        }}
      >
        <h3
          className="modal-title"
          style={{ flexShrink: 0, padding: "2rem 2rem 0.75rem 2rem" }}
        >
          Assign Trucks & Drivers
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({selectedTrucks.size} truck{selectedTrucks.size !== 1 ? "s" : ""}{" "}
            selected)
          </span>
        </h3>
        <div
          className="modal-body"
          style={{
            flexGrow: 1,
            overflow: "hidden",
            padding: "0 2rem",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Truck Filter */}
          <div
            className="flex justify-between items-end mb-6"
            style={{ flexShrink: 0 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <TutorialHighlight
                isHighlighted={shouldHighlight(".truck-filter-dropdown")}
              >
                <select
                  value={truckFilter}
                  onChange={(e) => setTruckFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 truck-filter-dropdown"
                >
                  <option value="all">All Trucks</option>
                  <option value="Food Truck">Food Trucks Only</option>
                  <option value="Beverage Truck">Beverage Trucks Only</option>
                  <option value="Dessert Truck">Dessert Trucks Only</option>
                  <option value="Holiday Truck">Holiday Trucks Only</option>
                </select>
              </TutorialHighlight>
            </div>
          </div>

          <div
            className="truck-list-container"
            style={{ flexGrow: 1, overflowY: "auto" }}
          >
            {isLoadingTrucks ? (
              <p className="text-gray-500">Loading trucks...</p>
            ) : trucksWithAssignments.length > 0 ? (
              <div className="space-y-4">
                {trucksWithAssignments.map((truck, index) => {
                  const isSelected = selectedTrucks.has(truck.id);

                  return (
                    <TruckItem
                      key={truck.id}
                      truck={truck}
                      isSelected={isSelected}
                      selectedDriverId={truck.selectedDriverId || ""}
                      onTruckSelection={handleTruckSelection}
                      onDriverAssignment={handleDriverAssignment}
                      shouldHighlight={shouldHighlight}
                      index={index}
                      availableDrivers={availableDrivers}
                      eventStartTime={eventStartTime}
                      eventEndTime={eventEndTime}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No trucks available.</p>
            )}
          </div>
        </div>
        <div
          className="modal-footer"
          style={{ flexShrink: 0, padding: "1.5rem 2rem" }}
        >
          <TutorialHighlight
            isHighlighted={shouldHighlight(
              ".modal-footer button.btn-secondary"
            )}
          >
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".modal-footer button.btn-primary")}
          >
            <button
              className="btn-primary"
              onClick={handleSaveAssignments}
              disabled={selectedTrucks.size === 0}
            >
              Save Assignments ({selectedTrucks.size} truck
              {selectedTrucks.size !== 1 ? "s" : ""} selected)
            </button>
          </TutorialHighlight>
        </div>
      </div>
    </div>
  );
}
