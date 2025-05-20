"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
} from "react";

interface Truck {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
}

interface FormData {
  name: string;
  date: string;
  time: string;
  location: string;
  requiredServers: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  trucks: string[];
}

export default function AddEventPage(): ReactElement {
  const [formData, setFormData] = useState<FormData>({
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

  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data

  // Fetch truck data from trucks.json
  useEffect(() => {
    fetch("/trucks.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => setTrucks(data))
      .catch((error) => console.error("Error fetching trucks:", error));
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("Event Created:", formData);
    // Add logic to save the event data (e.g., POST request to an API)
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
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="location" className="input-label">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
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
