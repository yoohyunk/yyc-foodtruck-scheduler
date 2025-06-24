"use client";

import React, { ReactElement } from "react";

interface Driver {
  id: string | number;
  name: string;
  role: string;
  email: string;
  phone: string;
  wage: number;
  isAvailable: boolean;
}

interface DriverCardProps {
  driver: Driver;
}

export default function DriverCard({ driver }: DriverCardProps): ReactElement {
  return (
    <div className="driver-card">
      <h3 className="font-bold text-lg mb-2">
        D-{String(driver.id).padStart(5, "0")}: {driver.name}
      </h3>
      <p className="text-sm mb-2"><strong>Role:</strong> {driver.role}</p>
      <p className="text-sm mb-2"><strong>Email:</strong> {driver.email}</p>
      <p className="text-sm mb-2"><strong>Phone:</strong> {driver.phone}</p>
      <p className="text-sm mb-3"><strong>Wage:</strong> ${driver.wage}/hr</p>
      <div className={`employee-status ${driver.isAvailable ? 'available' : 'unavailable'}`}>
        {driver.isAvailable ? "Available" : "Not Available"}
      </div>
    </div>
  );
}
