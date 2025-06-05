"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
} from "react";
import { EventFormData, Truck, Coordinates } from "@/app/types";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import { findClosestEmployees } from "@/app/AlgApi/distance";

export default function AddEventPage(): ReactElement {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    time: "",
    location: "",
    requiredServers: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    trucks: [], // Array to store selected trucks
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data
  const [employees, setEmployees] = useState<any[]>([]); // State to store employee data

  // Fetch truck and employee data
  useEffect(() => {
    // Fetch truck data
    fetch("/trucks.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => setTrucks(data))
      .catch((error) => console.error("Error fetching trucks:", error));

    // Fetch employee data
    fetch("/employees.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => setEmployees(data))
      .catch((error) => console.error("Error fetching employees:", error));
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLocationChange = (address: string, coords?: Coordinates) => {
    setFormData({
      ...formData,
      location: address,
    });
    setCoordinates(coords);
  };

  const handleTruckSelection = (truckId: string): void => {
    if (formData.trucks.includes(truckId)) {
      // Remove truck if already selected
      setFormData({
        ...formData,
        trucks: formData.trucks.filter((id) => id !== truckId),
      });
    } else {
      // Add truck if not already selected
      setFormData({
        ...formData,
        trucks: [...formData.trucks, truckId],
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!coordinates) {
      alert('Please select a valid address from the suggestions');
      return;
    }

    try {
      // Get the required number of servers
      const requiredServers = parseInt(formData.requiredServers);
      
      // Find the closest available servers
      const closestEmployees = await findClosestEmployees(
        formData.location,
        employees.filter(emp => emp.role === "Server" && emp.isAvailable),
        coordinates
      );

      // Take only the required number of servers
      const assignedStaff = closestEmployees
        .slice(0, requiredServers)
        .map(emp => emp.employeeId.toString());

      // Create event data
      const eventData = {
        title: formData.name,
        startTime: `${formData.date}T${formData.time}`,
        endTime: `${formData.date}T${formData.time}`, // You might want to add end time input
        location: formData.location,
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        trucks: formData.trucks,
        assignedStaff: assignedStaff,
        requiredServers: requiredServers,
        status: "Scheduled",
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone
      };

      // Get existing events
      const response = await fetch('/events.json');
      const events = await response.json();
      
      // Generate new ID (max existing ID + 1)
      const newId = Math.max(...events.map((evt: any) => parseInt(evt.id))) + 1;
      
      // Create new event with ID
      const newEvent = {
        id: newId.toString(),
        ...eventData
      };

      // Add new event to the list
      const updatedEvents = [...events, newEvent];

      // Save updated list
      const saveResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvents),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save event data');
      }

      // Show success message
      alert('Event created successfully with auto-assigned staff!');
      
      // Redirect to events list
      window.location.href = '/events';
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="add-event-page">
      <h1 className="form-header">Add New Event</h1>
      <form onSubmit={handleSubmit} className="event-form">
        <div className="input-group">
          <label htmlFor="name" className="input-label">
            Event Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="date" className="input-label">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md cursor-pointer hover:border-primary-medium focus:border-primary-dark focus:ring-1 focus:ring-primary-dark"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="time" className="input-label">
            Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            step="900"
            className="w-full p-2 border border-gray-300 rounded-md cursor-pointer hover:border-primary-medium focus:border-primary-dark focus:ring-1 focus:ring-primary-dark"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="location" className="input-label">
            Location
          </label>
          <AddressAutocomplete
            value={formData.location}
            onChange={handleLocationChange}
            placeholder="Enter event location"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="requiredServers" className="input-label">
            Required Servers
          </label>
          <input
            type="number"
            id="requiredServers"
            name="requiredServers"
            value={formData.requiredServers}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="contactName" className="input-label">
            Contact Name
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="contactEmail" className="input-label">
            Contact Email
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="contactPhone" className="input-label">
            Contact Phone
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            required
          />
        </div>

        {/* Truck Selection Section */}
        <div className="input-group">
          <label className="input-label">Select Trucks</label>
          <div className="truck-list">
            {trucks.map((truck) => (
              <label
                key={truck.id}
                className="truck-item flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={formData.trucks.includes(truck.id)}
                  onChange={() => handleTruckSelection(truck.id)}
                />
                <span>
                  {truck.name} ({truck.type}) -{" "}
                  <span
                    className={
                      truck.isAvailable
                        ? "status-available"
                        : "status-unavailable"
                    }
                  >
                    {truck.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="button">
          Create Event
        </button>
      </form>
    </div>
  );
}
