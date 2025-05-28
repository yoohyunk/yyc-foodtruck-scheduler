"use client";
import "../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ReactElement } from "react";
import { extractDate, extractTime } from "../utils";

interface Event {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
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
    const fetchEvent = async () => {
      try {
        const response = await fetch("/events.json", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error("Received data is not an array:", data);
          setEvent(null);
          return;
        }

        const eventData = data.find((event) => event.id === id);

        if (!eventData) {
          console.error("Event not found:", id);
          setEvent(null);
          return;
        }

        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
        setEvent(null);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  // Fetch employees and trucks
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const employeesResponse = await fetch("/employees.json", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!employeesResponse.ok) {
          throw new Error(`HTTP error! status: ${employeesResponse.status}`);
        }

        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);
        setIsLoadingEmployees(false);

        // Fetch trucks
        const trucksResponse = await fetch("/trucks.json", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!trucksResponse.ok) {
          throw new Error(`HTTP error! status: ${trucksResponse.status}`);
        }

        const trucksData = await trucksResponse.json();
        setTrucks(trucksData);
        setIsLoadingTrucks(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoadingEmployees(false);
        setIsLoadingTrucks(false);
      }
    };

    fetchData();
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
        <h1 className="event-detail-title">{event.title}</h1>
        <div className="event-detail-info-container">
          <p className="event-detail-info">
            <span className="info-label">Date:</span>{" "}
            {extractDate(event.startTime, event.endTime)}
          </p>
          <p className="event-detail-info">
            <span className="info-label">Time:</span>{" "}
            {extractTime(event.startTime)} - {extractTime(event.endTime)}
          </p>
          <p className="event-detail-info">
            <span className="info-label">Location:</span> {event.location}
          </p>
          {/* <p className="event-detail-info">
            <span className="info-label">Time:</span> {event.time}
          </p> */}
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
