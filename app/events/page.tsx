"use client";

import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { extractDate, extractTime } from "./utils";
import { Event } from "../types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { eventsApi } from "@/lib/supabase/events";

export default function Events(): ReactElement {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All"); // Default filter is "All"
  const [selectedDate, setSelectedDate] = useState<string>(""); // For date filtering
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await eventsApi.getAllEvents();
        // Sort events by start_date ascending (soonest first)
        const sorted = [...data].sort((a, b) => {
          const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
          const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
          return dateA - dateB;
        });
        setEvents(sorted);
        setFilteredEvents(sorted); // Initially show all events
        // Set global variable for tutorial navigation
        if (typeof window !== "undefined" && sorted.length > 0) {
          (window as { __TUTORIAL_EVENT_ID?: string }).__TUTORIAL_EVENT_ID =
            sorted[0].id;
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    // Add focus event listener to refresh data when user navigates back
    const handleFocus = () => {
      console.log("Events page: Refreshing data on focus");
      fetchEvents();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup event listener
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Filter events based on the active filter and date
  useEffect(() => {
    let filtered = [...events];

    // Apply status filter
    if (activeFilter !== "All") {
      filtered = filtered.filter((event) => {
        const eventStatus = event.status || "Pending";
        return activeFilter === eventStatus;
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate) {
      // If a date is selected, show events for that date (even if in the past)
      filtered = filtered.filter((event) => {
        const eventDate = event.start_date
          ? new Date(event.start_date).toISOString().split("T")[0]
          : "";
        return eventDate === selectedDate;
      });
    } else {
      // No date selected: show only events whose end_date is today or in the future
      filtered = filtered.filter((event) => {
        if (!event.end_date) return true;
        const eventEnd = new Date(event.end_date);
        eventEnd.setHours(0, 0, 0, 0);
        return eventEnd >= today;
      });
    }

    // Sort filtered events by start_date ascending
    filtered.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      return dateA - dateB;
    });

    setFilteredEvents(filtered);
  }, [activeFilter, selectedDate, events]);

  if (isLoading) {
    return (
      <div className="events-page">
        <h2 className="text-2xl text-primary-dark mb-4">Event Management</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading events...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <h2 className="text-2xl text-primary-dark mb-4">Event Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid grid-cols-3 gap-4 mb-6"
      >
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
      </TutorialHighlight>

      {/* Date and Distance Filters */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".additional-filters")}
        className="additional-filters grid grid-cols-2 gap-4 mb-6"
      >
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
      </TutorialHighlight>

      {/* Event List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".event-list")}
        className="event-list grid gap-4"
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => {
            // Highlight for "View Event Details" step (first card)
            const highlightViewDetailsButton =
              (index === 0 &&
                (shouldHighlight(".event-card:first-child .button") ||
                  shouldHighlight(`.event-card:nth-child(1) .button`))) ||
              false;

            // Use actual status from database, default to "Pending" if null
            const eventStatus = event.status || "Pending";

            return (
              <TutorialHighlight
                key={event.id}
                isHighlighted={shouldHighlight(
                  `.event-card:nth-child(${index + 1})`
                )}
                className="event-card bg-white p-4 rounded shadow relative"
              >
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p>
                  <strong>Date:</strong>{" "}
                  {event.start_date && event.end_date
                    ? extractDate(event.start_date, event.end_date)
                    : "Date not set"}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {event.start_date && event.end_date
                    ? `${extractTime(event.start_date)} - ${extractTime(event.end_date)}`
                    : "Time not set"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {event.description || "Location not set"}
                </p>
                <p>
                  <strong>Required Servers:</strong>{" "}
                  {event.number_of_servers_needed || 0}
                </p>
                <p>
                  <strong>Required Drivers:</strong>{" "}
                  {event.number_of_driver_needed || 0}
                </p>
                {event.contact_name && (
                  <p>
                    <strong>Contact:</strong> {event.contact_name}
                  </p>
                )}
                <p>
                  <strong>Payment:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      event.is_prepaid
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {event.is_prepaid ? "Prepaid" : "Pending"}
                  </span>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      eventStatus === "Pending"
                        ? "text-yellow-500"
                        : eventStatus === "Cancelled"
                          ? "text-red-500"
                          : "text-green-500"
                    }
                  >
                    {eventStatus}
                  </span>
                </p>
                <TutorialHighlight isHighlighted={highlightViewDetailsButton}>
                  <button
                    className="button mt-2"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    View Details
                  </button>
                </TutorialHighlight>
              </TutorialHighlight>
            );
          })
        ) : (
          <p className="text-gray-500">No events found.</p>
        )}
      </TutorialHighlight>

      {/* Create Event Button */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".sidebar")}
        className="mt-6"
      >
        <button
          className="button bg-primary-medium text-white w-full py-2 rounded-lg hover:bg-primary-dark"
          onClick={() => router.push("/events/newEvent")}
        >
          + Create Event
        </button>
      </TutorialHighlight>
    </div>
  );
}
