"use client";

import { useState, FormEvent, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { EventFormData } from "@/app/types";

export default function CreateEventPage(): ReactElement {
  const router = useRouter();
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    time: "",
    endTime: "",
    location: "",
    requiredServers: "0",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    trucks: [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Get current events
      const response = await fetch("/events.json");
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }
      const events = await response.json();

      // Create new event
      const newEvent = {
        id: `event_${Date.now()}`, // Generate unique ID
        title: formData.name,
        startTime: `${formData.date}T${formData.time}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        location: formData.location,
        trucks: formData.trucks,
        assignedStaff: [],
        requiredServers: parseInt(formData.requiredServers),
        status: "Scheduled",
      };

      // Add new event to the list
      const updatedEvents = [...events, newEvent];

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

      // Show success message and redirect
      alert("Event created successfully!");
      router.push("/events");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    }
  };

  return (
    <div className="create-event-page p-4">
      <button className="button mb-4" onClick={() => router.back()}>
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {/* Event Name */}
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Event Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block font-medium mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Start Time */}
        <div>
          <label htmlFor="time" className="block font-medium mb-1">
            Start Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* End Time */}
        <div>
          <label htmlFor="endTime" className="block font-medium mb-1">
            End Time
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block font-medium mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Required Servers */}
        <div>
          <label htmlFor="requiredServers" className="block font-medium mb-1">
            Required Servers
          </label>
          <input
            type="number"
            id="requiredServers"
            name="requiredServers"
            value={formData.requiredServers}
            onChange={handleInputChange}
            className="input-field"
            min="0"
            required
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Contact Information</h2>

          <div>
            <label htmlFor="contactName" className="block font-medium mb-1">
              Contact Name
            </label>
            <input
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block font-medium mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block font-medium mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
        >
          Create Event
        </button>
      </form>
    </div>
  );
}
