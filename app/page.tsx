"use client";
import "./globals.css";
import { useState, useEffect, ReactElement } from "react";
import { HomePageEvent, TimeOffRequest, NavLink } from "./types";
import { TutorialOverlay } from "./tutorial";
import { FiUsers, FiCalendar, FiTruck, FiClock } from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useTutorial } from "./tutorial/TutorialContext";
import { TutorialHighlight } from "./components/TutorialHighlight";

export default function Home(): ReactElement {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [events, setEvents] = useState<HomePageEvent[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);

  const { shouldHighlight } = useTutorial();

  // Fetch upcoming events
  useEffect(() => {
    fetch("/events.json")
      .then((response) => response.json())
      .then((data: HomePageEvent[]) => {
        if (Array.isArray(data)) {
          const upcomingEvents = data.filter(
            (event) => new Date(event.startTime) >= new Date()
          );
          setEvents(upcomingEvents.slice(0, 5)); // Show only the next 5 events
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        setEvents([]);
      });
  }, []);

  // Fetch time-off requests
  useEffect(() => {
    fetch("/timeOffRequests.json")
      .then((response) => response.json())
      .then((data: TimeOffRequest[]) => {
        const upcomingRequests = data.filter(
          (request) => new Date(request.date) >= new Date()
        );
        setTimeOffRequests(upcomingRequests.slice(0, 3)); // Show only the next 3 requests
      })
      .catch(() => {
        setTimeOffRequests([]);
      });
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
              {events.length > 0 ? (
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
              {timeOffRequests.length > 0 ? (
                timeOffRequests.map((request, index) => (
                  <div key={index} className="section-card">
                    <h3 className="section-card-title">{request.type}</h3>
                    <p className="section-card-text">
                      <strong>Start Date:</strong> {request.date}
                    </p>
                    <p className="section-card-text">
                      <strong>Duration:</strong> {request.duration}
                    </p>
                    <p className="section-card-text">
                      <strong>Reason:</strong> {request.reason}
                    </p>
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
