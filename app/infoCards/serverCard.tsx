"use client";

import React, { ReactElement } from "react";

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
    <div className="server-card">
      <h3 className="font-bold text-lg mb-2">
        S-{String(server.id).padStart(5, "0")}: {server.name}
      </h3>
      <p className="text-sm mb-2"><strong>Role:</strong> {server.role}</p>
      <p className="text-sm mb-2"><strong>Email:</strong> {server.email}</p>
      <p className="text-sm mb-2"><strong>Phone:</strong> {server.phone}</p>
      <p className="text-sm mb-3"><strong>Wage:</strong> ${server.wage}/hr</p>
      <div className={`employee-status ${server.isAvailable ? 'available' : 'unavailable'}`}>
        {server.isAvailable ? "Available" : "Not Available"}
      </div>
    </div>
  );
}
