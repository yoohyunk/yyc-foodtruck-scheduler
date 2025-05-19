"use client";
import "../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ReactElement } from "react";

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  requiredServers: number;
  trucks?: number[];
  assignedStaff?: number[];
}

interface Employee {
  id: number;
  name: string;
  role: string;
}

interface Truck {
  id: number;
  name: string;
  type: string;
}

export default function EventDetailsPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [assignedTrucks, setAssignedTrucks] = useState<Truck[]>([]);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isTruckModalOpen, setTruckModalOpen] = useState<boolean>(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [isLoadingTrucks, setIsLoadingTrucks] = useState<boolean>(true);

  // Fetch event details
  useEffect(() => {
    if (!id) return;

    fetch("/events.json")
      .then((response) => response.json())
      .then((data: Event[]) => {
        const eventData = data.find(
          (event) => event.id === parseInt(id as string)
        );
        setEvent(eventData || null);
      })
      .catch((error) => console.error("Error fetching event:", error));
  }, [id]);

  // Fetch employees and trucks
  useEffect(() => {
    fetch("/employee.json")
      .then((response) => response.json())
      .then((data: Employee[]) => {
        setEmployees(data);
        setIsLoadingEmployees(false);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
        setIsLoadingEmployees(false);
      });

    fetch("/trucks.json")
      .then((response) => response.json())
      .then((data: Truck[]) => {
        setTrucks(data);
        setIsLoadingTrucks(false);
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
        setIsLoadingTrucks(false);
      });
  }, []);

  const handleEmployeeSelection = (employee: Employee) => {
    if (assignedEmployees.some((e) => e.id === employee.id)) {
      setAssignedEmployees(
        assignedEmployees.filter((e) => e.id !== employee.id)
      );
    } else if (event && assignedEmployees.length < event.requiredServers) {
      setAssignedEmployees([...assignedEmployees, employee]);
    }
  };

  const handleTruckSelection = (truck: Truck) => {
    if (assignedTrucks.some((t) => t.id === truck.id)) {
      setAssignedTrucks(assignedTrucks.filter((t) => t.id !== truck.id));
    } else {
      setAssignedTrucks([...assignedTrucks, truck]);
    }
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="event-details-page">
      <button className="button" onClick={() => router.back()}>
        &larr; Back
      </button>

      <div className="event-detail-card">
        <h1 className="event-detail-title">{event.name}</h1>
        <div className="event-detail-info-container">
          <p className="event-detail-info">
            <span className="info-label">Date:</span> {event.date}
          </p>
          <p className="event-detail-info">
            <span className="info-label">Location:</span> {event.location}
          </p>
          <p className="event-detail-info">
            <span className="info-label">Time:</span> {event.time}
          </p>
          <p className="event-detail-info">
            <span className="info-label">Required Servers:</span>{" "}
            {event.requiredServers}
          </p>
        </div>
      </div>

      {/* Assign Staff and Trucks Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          onClick={() => setEmployeeModalOpen(true)}
        >
          Select Employees
        </button>
        <button
          className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
          onClick={() => setTruckModalOpen(true)}
        >
          Select Trucks
        </button>
      </div>

      {/* Employee Selection Modal */}
      {isEmployeeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="modal-title">Select Employees</h3>
            <div className="modal-body">
              {isLoadingEmployees ? (
                <p className="text-gray-500">Loading employees...</p>
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <label
                    key={employee.id}
                    className={`employee-label ${
                      assignedEmployees.some((e) => e.id === employee.id)
                        ? "employee-label-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="employee-checkbox"
                      checked={assignedEmployees.some(
                        (e) => e.id === employee.id
                      )}
                      onChange={() => handleEmployeeSelection(employee)}
                      disabled={
                        !assignedEmployees.some((e) => e.id === employee.id) &&
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
                onClick={() => setEmployeeModalOpen(false)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => setEmployeeModalOpen(false)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Truck Selection Modal */}
      {isTruckModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="modal-title">Select Trucks</h3>
            <div className="modal-body">
              {isLoadingTrucks ? (
                <p className="text-gray-500">Loading trucks...</p>
              ) : trucks.length > 0 ? (
                trucks.map((truck) => (
                  <label
                    key={truck.id}
                    className={`employee-label ${
                      assignedTrucks.some((t) => t.id === truck.id)
                        ? "employee-label-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="employee-checkbox"
                      checked={assignedTrucks.some((t) => t.id === truck.id)}
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

      {/* Assigned Employees Section */}
      {assignedEmployees.length > 0 && (
        <div className="assigned-section mt-8">
          <h2 className="assigned-section-title">Assigned Employees</h2>
          <div className="assigned-grid">
            {assignedEmployees.map((employee) => (
              <div key={employee.id} className="employee-card">
                <h3 className="employee-name">{employee.name}</h3>
                <p className="employee-role">Role: {employee.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Trucks Section */}
      {assignedTrucks.length > 0 && (
        <div className="assigned-section mt-8">
          <h2 className="assigned-section-title">Assigned Trucks</h2>
          <div className="assigned-grid">
            {assignedTrucks.map((truck) => (
              <div key={truck.id} className="truck-card">
                <h3 className="truck-title">{truck.name}</h3>
                <p className="truck-info">Type: {truck.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
