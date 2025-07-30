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
  const [searchQuery, setSearchQuery] = useState<string>(""); // For search functionality
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();
  const { user, isAdmin } = useAuth();
  const { loading: authLoading } = useAuth();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

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

  // Filter events based on the active filter, date, and search query
  useEffect(() => {
    if (isAdmin) {
      let filtered = [...adminEvents];
      
      // Apply status filter
      if (activeFilter !== "All") {
        filtered = filtered.filter((event) => {
          const eventStatus = event.status || "Pending";
          return activeFilter === eventStatus;
        });
      }
      
      // Apply date filter
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
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((event) => {
          const title = event.title?.toLowerCase() || "";
          const description = event.description?.toLowerCase() || "";
          const contactName = ("contact_name" in event && event.contact_name) ? event.contact_name.toLowerCase() : "";
          const location = event.addresses ? 
            `${event.addresses.street}, ${event.addresses.city}, ${event.addresses.province}, ${event.addresses.postal_code}`.toLowerCase() : "";
          
          return title.includes(query) || 
                 description.includes(query) || 
                 contactName.includes(query) || 
                 location.includes(query);
        });
      }
      
      // Sort by date
      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
      
      setFilteredAdminEvents(filtered);
    } else {
      let filtered = [...limitedEvents];
      
      // Apply date filter
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
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((event) => {
          const title = event.title?.toLowerCase() || "";
          const description = event.description?.toLowerCase() || "";
          
          return title.includes(query) || description.includes(query);
        });
      }
      
      // Sort by date
      filtered.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      });
      
      setFilteredLimitedEvents(filtered);
    }
  }, [activeFilter, selectedDate, searchQuery, adminEvents, limitedEvents, isAdmin]);

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
        className="filter-buttons grid grid-cols-3 gap-2 sm:gap-4 mb-6"
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

      {/* Search and Date Filters */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".additional-filters")}
        className="additional-filters grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {/* Search Filter */}
        <div className="search-input-container">
          <label
            htmlFor="search-filter"
            className="block text-primary-dark font-medium mb-2"
          >
            Search Events
          </label>
          <input
            type="text"
            id="search-filter"
            placeholder="Search by title, description, contact, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field search-input w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="search-clear-button"
              aria-label="Clear search"
              title="Clear search (Esc)"
            >
              ✕
            </button>
          )}
        </div>
        
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
      {(searchQuery.trim() || selectedDate) && (
        <div className="search-results-count">
          <p>
            Showing <span className="highlight">{isAdmin ? filteredAdminEvents.length : filteredLimitedEvents.length}</span> event(s)
            {searchQuery.trim() && (
              <>
                {" "}matching <span className="highlight">"{searchQuery}"</span>
              </>
            )}
            {selectedDate && (
              <>
                {" "}on <span className="highlight">{selectedDate}</span>
              </>
            )}
          </p>
        </div>
      )}

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
            <div className="search-no-results">
              <div className="search-no-results-icon">🔍</div>
              <h3>No events found</h3>
              <p>
                {searchQuery.trim() 
                  ? `No events match your search for "${searchQuery}". Try adjusting your search terms or filters.`
                  : "No events match your current filters. Try adjusting the date or status filters."
                }
              </p>
            </div>
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
          <div className="search-no-results">
            <div className="search-no-results-icon">🔍</div>
            <h3>No events found</h3>
            <p>
              {searchQuery.trim() 
                ? `No events match your search for "${searchQuery}". Try adjusting your search terms or filters.`
                : "No events match your current filters. Try adjusting the date or status filters."
              }
            </p>
          </div>
        )}
      </TutorialHighlight>
    </div>
  );
}
