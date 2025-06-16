"use client";

import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { extractDate, extractTime } from "./utils";
import { Event } from "../types";

export default function Events(): ReactElement {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All"); // Default filter is "All"
  const [selectedDate, setSelectedDate] = useState<string>(""); // For date filtering
  // const [maxDistance, setMaxDistance] = useState<string>(""); // For distance filtering
  const router = useRouter();

  // Fetch events from events.json
  useEffect(() => {
    fetch("/events.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Event[]) => {
        setEvents(data);
        setFilteredEvents(data); // Initially show all events
      })
      .catch((error) => console.error("Error fetching events:", error));
  }, []);

  // Filter events based on the active filter, date, and distance
  useEffect(() => {
    let filtered = [...events];

    // Apply status filter
    if (activeFilter !== "All") {
      filtered = filtered.filter((event) => {
        const isPending =
          !event.trucks ||
          event.trucks.length === 0 ||
          !event.assignedStaff ||
          event.assignedStaff.length < event.requiredServers;
        return activeFilter === "Pending" ? isPending : !isPending;
      });
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter((event) => event.startTime === selectedDate);
    }

    // Apply distance filter
    // if (maxDistance) {
    //   filtered = filtered.filter(
    //     (event) => event.distance <= parseFloat(maxDistance)
    //   );
    // }

    setFilteredEvents(filtered);
  }, [activeFilter, selectedDate, events]);

  return (
    <div className="events-page">
      <h2 className="text-2xl text-primary-dark mb-4">Event Management</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons grid grid-cols-3 gap-4 mb-6">
        <button
          className={`button ${activeFilter === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("All")}
        >
          All
        </button>
        <button
          className={`button ${activeFilter === "Pending" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Pending")}
        >
          Pending
        </button>
        <button
          className={`button ${activeFilter === "Scheduled" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Scheduled")}
        >
          Scheduled
        </button>
      </div>

      {/* Date and Distance Filters */}
      <div className="additional-filters grid grid-cols-2 gap-4 mb-6">
        {/* Date Filter */}
        <div>
          <label
            htmlFor="date-filter"
            className="block text-primary-dark font-medium mb-2"
          >
            Filter by Date
          </label>
          <input
            type="date"
            id="date-filter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field w-full"
          />
        </div>
        {/* Distance Filter */}
        {/* <div>
          <label
            htmlFor="distance-filter"
            className="block text-primary-dark font-medium mb-2"
          >
            Filter by Distance (km)
          </label>
          <input
            type="number"
            id="distance-filter"
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            className="input-field w-full"
            placeholder="Enter max distance"
          />
        </div> */}
      </div>

      {/* Event List */}
      <div className="event-list grid gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="event-card bg-secondary-light p-4 rounded shadow"
            >
              <h3 className="text-lg font-semibold">{event.title}</h3>
              <p>
                <strong>Date:</strong>{" "}
                {extractDate(event.startTime, event.endTime)}
              </p>
              <p>
                <strong>Time:</strong> {extractTime(event.startTime)} -{" "}
                {extractTime(event.endTime)}
              </p>
              <p>
                <strong>Location:</strong> {event.location}
              </p>
              {/* <p>
                <strong>Distance:</strong> {event.distance} km
              </p> */}
              <p>
                <strong>Required Servers:</strong> {event.requiredServers}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    !event.trucks ||
                    event.trucks.length === 0 ||
                    !event.assignedStaff ||
                    event.assignedStaff.length < event.requiredServers
                      ? "text-yellow-500"
                      : "text-green-500"
                  }
                >
                  {!event.trucks ||
                  event.trucks.length === 0 ||
                  !event.assignedStaff ||
                  event.assignedStaff.length < event.requiredServers
                    ? "Pending"
                    : "Scheduled"}
                </span>
              </p>
              <button
                className="button mt-2"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No events found.</p>
        )}
      </div>

      {/* Create Event Button */}
      <div className="mt-6">
        <button
          className="button bg-primary-medium text-white w-full py-2 rounded-lg hover:bg-primary-dark"
          onClick={() => router.push("/events/newEvent")}
        >
          + Create Event
        </button>
      </div>
    </div>
  );
}
