"use client";
import "../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ReactElement } from "react";
import { extractDate, extractTime } from "../utils";
import { Event, Employee, Truck } from "@/app/types";

export default function EventDetailsPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<(Employee & { id: number })[]>([]);
  const [assignedTrucks, setAssignedTrucks] = useState<Truck[]>([]);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isTruckModalOpen, setTruckModalOpen] = useState<boolean>(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [isLoadingTrucks, setIsLoadingTrucks] = useState<boolean>(true);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Fetch all events
  useEffect(() => {
    fetch("/events.json")
      .then((response) => response.json())
      .then((data: Event[]) => {
        setAllEvents(data);
      })
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

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

  // Update assigned employees when event or employees change
  useEffect(() => {
    if (event && employees.length > 0) {
      const assigned = employees.filter((emp) =>
        event.assignedStaff.includes(emp.id.toString())
      );
      // Only include Employee objects
      setAssignedEmployees(assigned.filter(isEmployee));
    }
  }, [event, employees]);

  // Update assigned trucks when event or trucks change
  useEffect(() => {
    if (event && trucks.length > 0) {
      const assigned = trucks.filter((truck) =>
        event.trucks.includes(truck.id)
      );
      setAssignedTrucks(assigned);
    }
  }, [event, trucks]);

  const handleEmployeeSelection = (employee: Employee) => {
    if (assignedEmployees.filter(isEmployee).some((e) => e.id === employee.id)) {
      setAssignedEmployees(
        assignedEmployees.filter(isEmployee).filter((e) => e.id !== employee.id)
      );
    } else if (event && assignedEmployees.filter(isEmployee).length < event.requiredServers) {
      setAssignedEmployees([...assignedEmployees.filter(isEmployee), employee]);
    }
  };

  const handleTruckSelection = (truck: Truck) => {
    if (assignedTrucks.some((t) => t.id === truck.id)) {
      // If truck is already assigned, remove it and its driver
      setAssignedTrucks(assignedTrucks.filter((t) => t.id !== truck.id));
      // Remove the driver if they were assigned with this truck
      setAssignedEmployees(
        assignedEmployees.filter(isEmployee).filter(
          (e) => !isDriver(truck.driver) || e.id.toString() !== truck.driver.id.toString()
        )
      );
    } else {
      setAssignedTrucks([...assignedTrucks, truck]);
    }
  };

  // Helper function to check driver availability
  const checkDriverAvailability = (driver: Employee, event: Event): boolean => {
    if (!driver.isAvailable) {
      console.log(
        `Driver ${driver.name} is not available (isAvailable flag is false)`
      );
      return false;
    }

    // Check if driver is available on the event day
    const eventDate = new Date(event.startTime);
    const dayOfWeek = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    if (!driver.availability.includes(dayOfWeek)) {
      console.log(`Driver ${driver.name} is not available on ${dayOfWeek}`);
      return false;
    }

    // Check if driver is already assigned to another event at the same time
    const hasOverlap = allEvents.some((e) => {
      if (e.id === event.id) return false;
      const otherStart = new Date(e.startTime);
      const otherEnd = new Date(e.endTime);
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      const overlap =
        (eventStart >= otherStart && eventStart < otherEnd) ||
        (eventEnd > otherStart && eventEnd <= otherEnd) ||
        (eventStart <= otherStart && eventEnd >= otherEnd);

      if (overlap && e.assignedStaff.includes(driver.id.toString())) {
        console.log(
          `Driver ${driver.name} has an overlap with event ${e.title}`
        );
        return true;
      }
      return false;
    });

    return !hasOverlap;
  };

  // Helper function to find alternative driver with less work hours
  const findAlternativeDriver = (
    employees: Employee[],
    event: Event
  ): Employee | null => {
    // Filter for available drivers
    const availableDrivers = employees.filter(
      (emp) =>
        emp.role === "Driver" &&
        emp.isAvailable &&
        emp.availability.includes(
          new Date(event.startTime).toLocaleDateString("en-US", {
            weekday: "long",
          })
        )
    );

    if (availableDrivers.length === 0) {
      console.log("No available drivers found");
      return null;
    }

    // Count current assignments for each driver
    const driverAssignments = availableDrivers.map((driver) => {
      const assignments = allEvents.filter((e) =>
        e.assignedStaff.includes(driver.id.toString())
      ).length;
      console.log(
        `Driver ${driver.name} has ${assignments} current assignments`
      );
      return { driver, assignments };
    });

    // Sort by number of assignments and return the driver with least assignments
    driverAssignments.sort((a, b) => a.assignments - b.assignments);
    const selectedDriver = driverAssignments[0].driver;
    console.log(
      `Selected alternative driver: ${selectedDriver.name} with ${driverAssignments[0].assignments} assignments`
    );
    return selectedDriver;
  };

  // Add a type guard for Employee
  function isEmployee(e: any): e is Employee {
    return typeof e === "object" && e !== null && "id" in e && typeof e.id === "number";
  }

  function isDriver(d: any): d is Employee {
    return typeof d === "object" && d !== null && "id" in d && typeof d.id === "number";
  }

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
        <button
          className="button bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
          onClick={async () => {
            if (
              window.confirm(
                "Are you sure you want to delete this event? This action cannot be undone."
              )
            ) {
              try {
                // Get current events
                const response = await fetch("/events.json");
                if (!response.ok) {
                  throw new Error("Failed to fetch events");
                }
                const events = await response.json();

                // Remove the event
                const updatedEvents = events.filter(
                  (evt: Event) => evt.id !== id
                );

                // Save updated events
                const saveResponse = await fetch("/api/events", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updatedEvents),
                });

                if (!saveResponse.ok) {
                  throw new Error("Failed to delete event");
                }

                // Show success message and redirect
                alert("Event deleted successfully");
                router.push("/events");
              } catch (error) {
                console.error("Error deleting event:", error);
                alert("Failed to delete event. Please try again.");
              }
            }
          }}
        >
          Delete Event
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
                      assignedEmployees.filter(isEmployee).some((e) => e.id === employee.id)
                        ? "employee-label-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="employee-checkbox"
                      checked={assignedEmployees.filter(isEmployee).some((e) => e.id === employee.id)}
                      onChange={() => handleEmployeeSelection(employee)}
                      disabled={
                        !assignedEmployees.filter(isEmployee).some((e) => e.id === employee.id) &&
                        assignedEmployees.filter(isEmployee).length >= event.requiredServers
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
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  try {
                    // Get current events
                    const response = await fetch("/events.json");
                    if (!response.ok) {
                      throw new Error("Failed to fetch events");
                    }
                    const events = await response.json();

                    // Find and update the current event
                    const updatedEvents = events.map((evt: Event) => {
                      if (evt.id === id) {
                        return {
                          ...evt,
                          trucks: assignedTrucks.map((truck) => truck.id),
                          assignedStaff: assignedEmployees.map((emp) =>
                            emp.id.toString()
                          ),
                        };
                      }
                      return evt;
                    });

                    // Save updated events
                    const saveResponse = await fetch("/api/events", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(updatedEvents),
                    });

                    if (!saveResponse.ok) {
                      throw new Error("Failed to save event");
                    }

                    // Show success message and close modal
                    alert("Truck assignments saved successfully");
                    setTruckModalOpen(false);
                  } catch (error) {
                    console.error("Error saving truck assignments:", error);
                    alert(
                      "Failed to save truck assignments. Please try again."
                    );
                  }
                }}
              >
                Save Assignments
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
                <p className="truck-info">
                  Driver: {truck.driver ? truck.driver.name : "Not assigned"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
