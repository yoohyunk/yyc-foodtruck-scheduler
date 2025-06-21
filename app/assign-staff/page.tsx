"use client";

import { useState, useEffect } from "react";
import { findClosestEmployees, EmployeeWithDistance } from "../AlgApi/distance";

interface Employee {
  id: number;
  name: string;
  wage: number;
  address: string;
  role: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  availability: string[];
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  trucks: string[];
  assignedStaff: string[];
  requiredServers: number;
  status: string;
}

export default function AssignStaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [assignedStaff, setAssignedStaff] = useState<EmployeeWithDistance[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch employees and events data
    Promise.all([
      fetch("/employees.json").then((res) => res.json()),
      fetch("/events.json").then((res) => res.json()),
    ])
      .then(([employeesData, eventsData]) => {
        setEmployees(employeesData);
        setEvents(eventsData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load data")
      );
  }, []);

  const handleAutoAssign = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    setError(null);

    try {
      const event = events.find((e) => e.id === selectedEvent);
      if (!event) throw new Error("Event not found");

      // Get closest employees within 5km
      const closestEmployees = await findClosestEmployees(
        event.location,
        employees
      );

      // Sort by distance first, then by wage for employees within 5km
      const sortedEmployees = closestEmployees.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) <= 5) {
          // If within 5km of each other, sort by wage
          return a.wage - b.wage;
        }
        // Otherwise sort by distance
        return a.distance - b.distance;
      });

      // Take only the required number of servers
      const assigned = sortedEmployees.slice(0, event.requiredServers);
      setAssignedStaff(assigned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Auto-Assign Staff</h1>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event
        </label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} - {event.location} (Required Servers:{" "}
              {event.requiredServers})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAutoAssign}
        disabled={!selectedEvent || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
      >
        {loading ? "Assigning Staff..." : "Auto-Assign Staff"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {assignedStaff.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Assigned Staff</h2>
          <div className="grid gap-4">
            {assignedStaff.map((employee) => (
              <div
                key={employee.employeeId}
                className="p-4 bg-white rounded-lg shadow border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{employee.name}</h3>
                    <p className="text-sm text-gray-600">
                      Distance: {employee.distance.toFixed(2)} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Wage: ${employee.wage}/hr
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
