"use client";

import React, { ReactElement, useState } from "react";

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
  downForService?: boolean; // ✅ new optional flag
}

interface TruckCardProps {
  truck: Truck;
  viewMode: "compact" | "detailed";
}

interface TruckListProps {
  trucks: Truck[];
  viewMode: "compact" | "detailed";
}

export default function TruckCard({
  truck,
  viewMode,
}: TruckCardProps): ReactElement {
  const [isDown, setIsDown] = useState<boolean>(truck.downForService ?? false);

  const handleToggle = () => {
    setIsDown((prev) => !prev);
    // You can add API/supabase update logic here if needed
  };

  return (
    <div
      className={`truck-card ${
        viewMode === "compact" ? "p-2 text-sm" : "p-4 text-base"
      } border rounded-lg shadow-md relative`}
    >
      <h3
        className={`font-bold ${viewMode === "compact" ? "text-sm" : "text-xl"} mb-2`}
      >
        {truck.name}
      </h3>

      {/* ✅ Toggle */}
      <label className="inline-flex items-center gap-2 text-sm mb-2">
        <input type="checkbox" checked={isDown} onChange={handleToggle} />
        <span>Down for Service</span>
      </label>

      {/* ✅ Red Badge */}
      {isDown && (
        <p className="text-red-600 font-semibold text-sm mb-2">
          🚫 Truck is currently down for service.
        </p>
      )}

      {viewMode === "detailed" && (
        <>
          <p>
            T-{String(truck.id).padStart(4, "0")}: {truck.name}
          </p>
          <p className="text-primary-medium mb-2">Type: {truck.type}</p>
          <p className="text-primary-medium mb-2">
            Capacity: {truck.capacity} items
          </p>
          <p className="text-primary-medium mb-2">Location: {truck.location}</p>
        </>
      )}

      <div className="mt-2">
        <span
          className={`badge ${
            truck.status === "Available" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {truck.status}
        </span>
      </div>

      <div className="mt-4">
        <h4 className="font-bold text-md">Assigned Driver:</h4>
        {truck.driver ? (
          <div className="driver-info border rounded-lg p-2 shadow-md bg-gray-100 mt-2">
            <p className="text-sm font-bold">
              D-{String(truck.driver.id).padStart(5, "0")}: {truck.driver.name}
            </p>
            <p className="text-sm text-primary-medium">
              Email: {truck.driver.email}
            </p>
            <p className="text-sm text-primary-medium">
              Phone: {truck.driver.phone}
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-500 mt-2">
            No driver assigned. A driver is required for this truck.
          </p>
        )}
      </div>
    </div>
  );
}

// ✅ TruckList stays the same
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
