"use client";

import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { extractDate, extractTime } from "./utils";
import { Event, getEventStatusFilterColor } from "../types";
import type { Tables } from "@/database.types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { eventsApi } from "@/lib/supabase/events";
import { useAuth } from "@/contexts/AuthContext";
import SearchInput from "../components/SearchInput";

export default function Events(): ReactElement {
  const [adminEvents, setAdminEvents] = useState<Event[]>([]);
  const [limitedEvents, setLimitedEvents] = useState<
    Tables<"event_basic_info_view">[]
  >([]);
  const [filteredAdminEvents, setFilteredAdminEvents] = useState<Event[]>([]);
  const [filteredLimitedEvents, setFilteredLimitedEvents] = useState<
    Tables<"event_basic_info_view">[]
  >([]);
  const [activeFilter, setActiveFilter] = useState<string>("All"); // Default filter is "All"
  const [selectedDate, setSelectedDate] = useState<string>(""); // For date filtering
  const [searchTerm, setSearchTerm] = useState<string>(""); // For search filtering
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();
  const { user, isAdmin } = useAuth();
  const { loading: authLoading } = useAuth();

  // Fetch events from Supabase
  useEffect(() => {
    if (authLoading || typeof isAdmin === "undefined") {
      return;
    }

    setAdminEvents([]);
    setLimitedEvents([]);

    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (isAdmin) {
          const data = await eventsApi.getAllEvents();
          const sorted = [...data].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateA - dateB;
          });
          setAdminEvents(sorted);
          setFilteredAdminEvents(sorted);
          if (typeof window !== "undefined" && sorted.length > 0) {
            (window as { __TUTORIAL_EVENT_ID?: string }).__TUTORIAL_EVENT_ID =
              sorted[0].id;
          }
        } else {
          // Fetch only events assigned to the current user
          if (!user?.id) {
            setLimitedEvents([]);
            setFilteredLimitedEvents([]);
            setIsLoading(false);
            return;
          }
          const response = await fetch(
            `/api/events/assigned?userId=${user.id}`
          );
          if (!response.ok) {
            setError("Failed to load assigned events. Please try again.");
            setLimitedEvents([]);
            setFilteredLimitedEvents([]);
            setIsLoading(false);
            return;
          }
          const result = await response.json();
          const data = result.events || [];
          const sorted = [...data].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateA - dateB;
          });
          setLimitedEvents(sorted);
          setFilteredLimitedEvents(sorted);
          if (typeof window !== "undefined" && sorted.length > 0) {
            (window as { __TUTORIAL_EVENT_ID?: string }).__TUTORIAL_EVENT_ID =
              sorted[0].id as string;
          }
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    const handleFocus = () => {
      fetchEvents();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAdmin, user, authLoading]);

  // Filter events based on the active filter, date, and search term
  useEffect(() => {
    if (isAdmin) {
      let filtered = [...adminEvents];

      // Filter by status
      if (activeFilter !== "All") {
        filtered = filtered.filter((event) => {
          const eventStatus = event.status || "Pending";
          return activeFilter === eventStatus;
        });
      }

      // Filter by search term
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter((event) => {
          const title = (event.title || "").toLowerCase();
          const description = (event.description || "").toLowerCase();
          const contactName =
            "contact_name" in event && event.contact_name
              ? event.contact_name.toLowerCase()
              : "";
          const status = (event.status || "").toLowerCase();

          return (
            title.includes(searchLower) ||
            description.includes(searchLower) ||
            contactName.includes(searchLower) ||
            status.includes(searchLower)
          );
        });
      }

      // Filter by date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate) {
        filtered = filtered.filter((event) => {
          const eventDate = event.start_date
            ? new Date(event.start_date).toISOString().split("T")[0]
            : "";
          return eventDate === selectedDate;
        });
      } else {
        filtered = filtered.filter((event) => {
          if (!event.end_date) return true;
          const eventEnd = new Date(event.end_date);
          eventEnd.setHours(0, 0, 0, 0);
          return eventEnd >= today;
        });
      }

      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
      setFilteredAdminEvents(filtered);
    } else {
      let filtered = [...limitedEvents];

      // Filter by search term
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter((event) => {
          const title = (event.title || "").toLowerCase();
          const description = (event.description || "").toLowerCase();
          const status = (event.status || "").toLowerCase();

          return (
            title.includes(searchLower) ||
            description.includes(searchLower) ||
            status.includes(searchLower)
          );
        });
      }

      // Filter by date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate) {
        filtered = filtered.filter((event) => {
          const eventDate = event.start_date
            ? new Date(event.start_date).toISOString().split("T")[0]
            : "";
          return eventDate === selectedDate;
        });
      } else {
        filtered = filtered.filter((event) => {
          if (!event.end_date) return true;
          const eventEnd = new Date(event.end_date);
          eventEnd.setHours(0, 0, 0, 0);
          return eventEnd >= today;
        });
      }

      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
      setFilteredLimitedEvents(filtered);
    }
  }, [
    activeFilter,
    selectedDate,
    searchTerm,
    adminEvents,
    limitedEvents,
    isAdmin,
  ]);

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
      {/* Search Input */}
      <div className="search-input-container">
        <SearchInput
          placeholder="Search events by title, description, contact, or status..."
          onSearch={setSearchTerm}
        />
      </div>

      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid grid-cols-3 gap-4 mb-6"
      >
        <button
          className={`button ${getEventStatusFilterColor("All", activeFilter === "All")}`}
          onClick={() => setActiveFilter("All")}
        >
          All
        </button>
        <button
          className={`button ${getEventStatusFilterColor("Pending", activeFilter === "Pending")}`}
          onClick={() => setActiveFilter("Pending")}
        >
          Pending
        </button>
        <button
          className={`button ${getEventStatusFilterColor("Scheduled", activeFilter === "Scheduled")}`}
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

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {isAdmin ? (
          searchTerm.trim() || activeFilter !== "All" || selectedDate ? (
            <span>
              Showing {filteredAdminEvents.length} of {adminEvents.length}{" "}
              events
              {searchTerm.trim() && ` matching "${searchTerm}"`}
              {activeFilter !== "All" && ` with ${activeFilter} status`}
              {selectedDate && ` on ${selectedDate}`}
            </span>
          ) : (
            <span>Showing all {adminEvents.length} events</span>
          )
        ) : searchTerm.trim() || selectedDate ? (
          <span>
            Showing {filteredLimitedEvents.length} of {limitedEvents.length}{" "}
            events
            {searchTerm.trim() && ` matching "${searchTerm}"`}
            {selectedDate && ` on ${selectedDate}`}
          </span>
        ) : (
          <span>Showing all {limitedEvents.length} events</span>
        )}
      </div>

      {/* Event List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".event-list")}
        className="event-list grid gap-4"
      >
        {isAdmin ? (
          filteredAdminEvents.length > 0 ? (
            filteredAdminEvents.map((event) => (
              <TutorialHighlight
                key={String(event.id)}
                isHighlighted={shouldHighlight(
                  `.event-card:nth-child(${filteredAdminEvents.indexOf(event) + 1})`
                )}
                className={`event-card bg-white p-4 rounded shadow relative status-${(event.status || "unknown").toLowerCase()}`}
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
                  <strong>Description:</strong>{" "}
                  {event.description || "No description"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {event.addresses
                    ? `${event.addresses.street}, ${event.addresses.city}, ${event.addresses.province}, ${event.addresses.postal_code}`
                    : "Location not set"}
                </p>
                {"status" in event && event.status && (
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold
                          ${
                            event.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : event.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : event.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                          }
                        `}
                      style={{ marginLeft: 8 }}
                    >
                      {event.status}
                    </span>
                  </p>
                )}
                {"contact_name" in event && (
                  <p>
                    <strong>Contact:</strong> {event.contact_name || "N/A"}
                  </p>
                )}
                {"is_prepaid" in event && (
                  <p>
                    <strong>Prepaid:</strong> {event.is_prepaid ? "Yes" : "No"}
                  </p>
                )}
                {"number_of_servers_needed" in event && (
                  <p>
                    <strong>Servers Needed:</strong>{" "}
                    {event.number_of_servers_needed}
                  </p>
                )}
                {"number_of_driver_needed" in event && (
                  <p>
                    <strong>Drivers Needed:</strong>{" "}
                    {event.number_of_driver_needed}
                  </p>
                )}
                <TutorialHighlight isHighlighted={false}>
                  <button
                    className="button mt-2"
                    onClick={() => router.push(`/events/${event.id}`)}
                  >
                    View Details
                  </button>
                </TutorialHighlight>
              </TutorialHighlight>
            ))
          ) : (
            <p className="text-gray-500">No events found.</p>
          )
        ) : filteredLimitedEvents.length > 0 ? (
          filteredLimitedEvents.map((event) => (
            <TutorialHighlight
              key={String(event.id)}
              isHighlighted={shouldHighlight(
                `.event-card:nth-child(${filteredLimitedEvents.indexOf(event) + 1})`
              )}
              className={`event-card bg-white p-4 rounded shadow relative status-${(event.status || "unknown").toLowerCase()}`}
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
                <strong>Description:</strong>{" "}
                {event.description || "No description"}
              </p>
              {event.status && (
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold
                        ${
                          event.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : event.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : event.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                        }
                      `}
                    style={{ marginLeft: 8 }}
                  >
                    {event.status}
                  </span>
                </p>
              )}
              <TutorialHighlight isHighlighted={false}>
                <button
                  className="button mt-2"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  View Details
                </button>
              </TutorialHighlight>
            </TutorialHighlight>
          ))
        ) : (
          <p className="text-gray-500">No events found.</p>
        )}
      </TutorialHighlight>
    </div>
  );
}
