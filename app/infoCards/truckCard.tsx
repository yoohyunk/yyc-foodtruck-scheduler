"use client";

import React, { ReactElement } from "react";

interface Driver {
  id: string | number;
  name: string;
  email: string;
  phone: string;
}

interface Truck {
  id: string | number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  status: "Available" | "In Use";
  driver: Driver | null;
}

interface TruckCardProps {
  truck: Truck;
  viewMode: "compact" | "detailed";
}

interface TruckListProps {
  trucks: Truck[];
  viewMode: "compact" | "detailed";
}

// TruckCard component with two display modes: compact and detailed
export default function TruckCard({
  truck,
  viewMode,
}: TruckCardProps): ReactElement {
  return (
    <div className="truck-card">
      <h3 className="font-bold text-xl mb-2">
        {truck.name}
      </h3>
      {viewMode === "detailed" && (
        <>
          <p className="text-sm mb-2"><strong>ID:</strong> T-{String(truck.id).padStart(4, "0")}</p>
          <p className="text-sm mb-2"><strong>Type:</strong> {truck.type}</p>
          <p className="text-sm mb-2"><strong>Capacity:</strong> {truck.capacity} items</p>
          <p className="text-sm mb-3"><strong>Location:</strong> {truck.location}</p>
        </>
      )}
      <div className="mt-2 mb-3">
        <div className={`employee-status ${truck.status === "Available" ? 'available' : 'unavailable'}`}>
          {truck.status}
        </div>
      </div>
      <div className="mt-4">
        <h4 className="font-bold text-md mb-2">Assigned Driver:</h4>
        {truck.driver ? (
          <div className="assigned-employee-card">
            <p className="assigned-employee-name">
              D-{String(truck.driver.id).padStart(5, "0")}: {truck.driver.name}
            </p>
            <p className="assigned-employee-role">
              Email: {truck.driver.email}
            </p>
            <p className="assigned-employee-role">
              Phone: {truck.driver.phone}
            </p>
          </div>
        ) : (
          <div className="error-container p-3">
            <p className="text-sm font-bold">
            No driver assigned. A driver is required for this truck.
          </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Example usage of TruckCard
export function TruckList({ trucks, viewMode }: TruckListProps): ReactElement {
  return (
    <div
      className={`truck-list ${
        viewMode === "compact"
          ? "grid grid-cols-7 gap-2"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      }`}
    >
      {trucks.map((truck) => (
        <TruckCard key={truck.id} truck={truck} viewMode={viewMode} />
      ))}
    </div>
  );
}

// Example data for testing
