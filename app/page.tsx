"use client";
import "./globals.css";
import { useState, useEffect, ReactElement } from "react";
import { HomePageEvent, TimeOffRequest, NavLink } from "./types";
import { TutorialOverlay } from "./tutorial";
import { FiUsers, FiCalendar, FiTruck, FiClock } from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useTutorial } from "./tutorial/TutorialContext";
import { TutorialHighlight } from "./components/TutorialHighlight";
import { eventsApi } from "@/lib/supabase/events";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";

export default function Home(): ReactElement {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [events, setEvents] = useState<HomePageEvent[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { shouldHighlight } = useTutorial();

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch upcoming events
        const eventsData = await eventsApi.getAllEvents();
        const upcomingEvents = eventsData
          .filter((event) => new Date(event.start_date) >= new Date())
          .slice(0, 6)
          .map((event) => ({
            title: event.title || "Untitled Event",
            startTime: new Date(event.start_date).toLocaleDateString(),
            location: event.description || "Location not set",
          }));

        setEvents(upcomingEvents);

        // Fetch time-off requests
        const requestsData = await timeOffRequestsApi.getAllTimeOffRequests();
        const upcomingRequests = requestsData
          .filter((request) => new Date(request.start_datetime) >= new Date())
          .slice(0, 4)
          .map((request) => ({
            id: request.id,
            employee_id: request.employee_id,
            start_datetime: request.start_datetime,
            end_datetime: request.end_datetime,
            reason: request.reason,
            type: request.type || "Time Off",
            status: request.status,
            created_at: request.created_at,
          }));

        setTimeOffRequests(upcomingRequests);
      } catch (error) {
        console.error("Error fetching data:", error);
        setEvents([]);
        setTimeOffRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const links: NavLink[] = [
    { name: "Schedule", href: "/schedule", icon: <FiCalendar /> },
    { name: "Employees", href: "/employees", icon: <FiUsers /> },
    { name: "Events", href: "/events", icon: <FaRegCalendarAlt /> },
    { name: "Trucks", href: "/trucks", icon: <FiTruck /> },
    { name: "Time-Off", href: "/requests", icon: <FiClock /> },
  ];

  return (
    <div className="landing-container">
      <TutorialOverlay />
      <main className="landing-main">
        <h1 className="landing-title">YYC Food Trucks</h1>
        <p className="landing-subtitle">
          Employee scheduling and management system
        </p>

        <div className="landing-links">
          {links.map((link, index) => {
            // Build the selector for this TutorialHighlight component
            const selector = `.landing-links .TutorialHighlight:nth-child(${index + 1})`;
            const isHighlighted = shouldHighlight(selector);
            return (
              <TutorialHighlight
                key={index}
                isHighlighted={isHighlighted}
                className={`landing-link ${hoveredLink === index ? "bg-gray-100 scale-105 transition-transform" : ""}`}
              >
                <a
                  href={link.href}
                  className="landing-link-inner"
                  onMouseEnter={() => setHoveredLink(index)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <span className="landing-link-icon">{link.icon}</span>
                  <span>{link.name}</span>
                </a>
              </TutorialHighlight>
            );
          })}
        </div>

        {/* Upcoming Events Section */}
        <TutorialHighlight
          isHighlighted={shouldHighlight(".upcoming-events-highlight")}
          className="upcoming-events-highlight"
        >
          <section data-section="upcoming-events">
            <h2 className="section-title">Upcoming Events</h2>
            <div className="grid gap-4">
              {isLoading ? (
                <p className="text-gray-500">Loading events...</p>
              ) : events.length > 0 ? (
                events.map((event, index) => (
                  <div key={index} className="section-card">
                    <h3 className="section-card-title">{event.title}</h3>
                    <p className="section-card-text">
                      <strong>Date:</strong> {event.startTime}
                    </p>
                    <p className="section-card-text">
                      <strong>Location:</strong> {event.location}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No upcoming events.</p>
              )}
            </div>
          </section>
        </TutorialHighlight>

        {/* Time-Off Requests Section */}
        <TutorialHighlight
          isHighlighted={shouldHighlight(".timeoff-requests-highlight")}
          className="timeoff-requests-highlight"
        >
          <section data-section="timeoff-requests">
            <h2 className="section-title">Time-Off Requests</h2>
            <div className="grid gap-4">
              {isLoading ? (
                <p className="text-gray-500">Loading requests...</p>
              ) : timeOffRequests.length > 0 ? (
                timeOffRequests.map((request, index) => (
                  <div key={index} className="section-card">
                    <h3 className="section-card-title">{request.type}</h3>
                    <p className="section-card-text">
                      <strong>Start Date:</strong>{" "}
                      {new Date(request.start_datetime).toLocaleDateString()}
                    </p>
                    <p className="section-card-text">
                      <strong>End Date:</strong>{" "}
                      {new Date(request.end_datetime).toLocaleDateString()}
                    </p>
                    <p className="section-card-text">
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          request.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </p>
                    {request.reason && (
                      <p className="section-card-text">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No upcoming time-off requests.</p>
              )}
            </div>
          </section>
        </TutorialHighlight>
      </main>
    </div>
  );
}
