'use client';

import React, { ReactElement } from 'react';

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
    <div className="driver-card border rounded-lg p-4 shadow-md bg-gray-100">
      <h3 className="font-bold text-lg mb-2">
        D-{String(driver.id).padStart(5, '0')}: {driver.name}
      </h3>
      <p className="text-sm text-primary-medium">Role: {driver.role}</p>
      <p className="text-sm text-primary-medium">Email: {driver.email}</p>
      <p className="text-sm text-primary-medium">Phone: {driver.phone}</p>
      <p className="text-sm text-primary-medium">Wage: ${driver.wage}/hr</p>
      <p
        className={`text-sm font-bold ${
          driver.isAvailable ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {driver.isAvailable ? 'Available' : 'Not Available'}
      </p>
    </div>
  );
}