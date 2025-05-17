'use client';

import React, { ReactElement } from 'react';

interface Server {
  id: string | number;
  name: string;
  role: string;
  email: string;
  phone: string;
  wage: number;
  isAvailable: boolean;
}

interface ServerCardProps {
  server: Server;
}

export default function ServerCard({ server }: ServerCardProps): ReactElement {
  return (
    <div className="server-card border rounded-lg p-4 shadow-md bg-gray-100">
      <h3 className="font-bold text-lg mb-2">
        S-{String(server.id).padStart(5, '0')}: {server.name}
      </h3>
      <p className="text-sm text-primary-medium">Role: {server.role}</p>
      <p className="text-sm text-primary-medium">Email: {server.email}</p>
      <p className="text-sm text-primary-medium">Phone: {server.phone}</p>
      <p className="text-sm text-primary-medium">Wage: ${server.wage}/hr</p>
      <p
        className={`text-sm font-bold ${
          server.isAvailable ? 'text-green-500' : 'text-red-500'
        }`}
      >
        {server.isAvailable ? 'Available' : 'Not Available'}
      </p>
    </div>
  );
}