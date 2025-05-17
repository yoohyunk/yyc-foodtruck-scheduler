'use client';

import React, { useState, ReactElement } from 'react';

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  requiredServers: number;
  trucks?: string[];
  assignedStaff?: string[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface Truck {
  id: string;
  name: string;
  type: string;
  capacity: string;
}

interface EventCardProps {
  event: Event;
  trucks: Truck[];
  employees: Employee[];
}

export default function EventCard({ event, trucks, employees }: EventCardProps): ReactElement {
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [assignedTrucks, setAssignedTrucks] = useState<Truck[]>([]);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [truckModalOpen, setTruckModalOpen] = useState<boolean>(false);

  const handleEmployeeSelection = (employee: Employee): void => {
    if (assignedEmployees.some((assigned) => assigned.id === employee.id)) {
      setAssignedEmployees(assignedEmployees.filter((assigned) => assigned.id !== employee.id));
    } else if (assignedEmployees.length < event.requiredServers) {
      setAssignedEmployees([...assignedEmployees, employee]);
    }
  };

  const handleTruckSelection = (truck: Truck): void => {
    if (assignedTrucks.some((assigned) => assigned.id === truck.id)) {
      setAssignedTrucks(assignedTrucks.filter((assigned) => assigned.id !== truck.id));
    } else {
      setAssignedTrucks([...assignedTrucks, truck]);
    }
  };

  return (
    <div className="event-card">
      <a href={`/events/${event.id}`} className="event-title">
        {event.name}
      </a>
      <p className="event-info">Date: {event.date}</p>
      <p className="event-info">Location: {event.location}</p>
      <p className="event-info">Time: {event.time}</p>

      <div className="event-section">
        <h4 className="event-subtitle">Required Servers: {event.requiredServers}</h4>
        <button
          className="btn-primary"
          onClick={() => setModalOpen(true)}
        >
          Select Employees
        </button>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h3 className="modal-title">
                Select Employees
              </h3>
              <div className="modal-body">
                {employees && employees.length > 0 ? (
                  employees.map((employee) => (
                    <label
                      key={employee.id}
                      className={`employee-label ${assignedEmployees.some((assigned) => assigned.id === employee.id) ? 'employee-label-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="employee-checkbox"
                        checked={assignedEmployees.some((assigned) => assigned.id === employee.id)}
                        onChange={() => handleEmployeeSelection(employee)}
                        disabled={
                          !assignedEmployees.some((assigned) => assigned.id === employee.id) &&
                          assignedEmployees.length >= event.requiredServers
                        }
                      />
                      <span className="employee-name">
                        {employee.name} ({employee.role})
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">No employees available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setModalOpen(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Truck Selection Section */}
      <div className="event-section">
        <h4 className="event-subtitle">Required Trucks</h4>
        <button
          className="btn-primary"
          onClick={() => setTruckModalOpen(true)}
        >
          Select Trucks
        </button>

        {truckModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <h3 className="modal-title">
                Select Trucks
              </h3>
              <div className="modal-body">
                {trucks && trucks.length > 0 ? (
                  trucks.map((truck) => (
                    <label
                      key={truck.id}
                      className={`employee-label ${assignedTrucks.some((assigned) => assigned.id === truck.id) ? 'employee-label-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="employee-checkbox"
                        checked={assignedTrucks.some((assigned) => assigned.id === truck.id)}
                        onChange={() => handleTruckSelection(truck)}
                      />
                      <span className="employee-name">
                        {truck.name} ({truck.type})
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">No trucks available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setTruckModalOpen(false)}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setTruckModalOpen(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {assignedEmployees.length > 0 && (
        <div className="event-section">
          <h4 className="event-subtitle">
            Assigned Employees:
          </h4>
          <div className="assigned-employees-container">
            {assignedEmployees.map((employee) => (
              <div
                key={employee.id}
                className="assigned-employee-card"
              >
                <h3 className="assigned-employee-name">
                  {employee.name}
                </h3>
                <p className="assigned-employee-role">Role: {employee.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display Selected Trucks */}
      {assignedTrucks.length > 0 && (
        <div className="event-section">
          <h4 className="event-subtitle">
            Assigned Trucks:
          </h4>
          <div className="assigned-employees-container">
            {assignedTrucks.map((truck) => (
              <div
                key={truck.id}
                className="assigned-employee-card"
              >
                <h3 className="assigned-employee-name">
                  {truck.name}
                </h3>
                <p className="assigned-employee-role">Type: {truck.type}</p>
                <p className="assigned-employee-role">Capacity: {truck.capacity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}