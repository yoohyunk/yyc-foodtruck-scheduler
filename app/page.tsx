"use client";
import "./globals.css";
import { useState, useEffect, ReactElement } from "react";

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  trucks: string[];
  assignedStaff: string[];
  requiredServers: number;
}

interface TimeOffRequest {
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface Link {
  name: string;
  href: string;
  icon: string;
}

export default function Home(): ReactElement {
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);

  // Fetch upcoming events
  useEffect(() => {
    fetch("/events.json")
      .then((response) => response.json())
      .then((data: Event[]) => {
        if (Array.isArray(data)) {
          const upcomingEvents = data.filter(
            (event) => new Date(event.date) >= new Date()
          );
          setEvents(upcomingEvents.slice(0, 5)); // Show only the next 5 events
        } else {
          console.error("Received data is not an array:", data);
          setEvents([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setEvents([]);
      });
  }, []);

  // Fetch time-off requests
  useEffect(() => {
    fetch("/timeOffRequests.json")
      .then((response) => response.json())
      .then((data: TimeOffRequest[]) => {
        const upcomingRequests = data.filter(
          (request) => new Date(request.startDate) >= new Date()
        );
        setTimeOffRequests(upcomingRequests.slice(0, 3)); // Show only the next 3 requests
      })
      .catch((error) =>
        console.error("Error fetching time-off requests:", error)
      );
  }, []);

  const links: Link[] = [
    { name: "Schedule", href: "/schedule", icon: "📅" },
    { name: "Employees", href: "/employees", icon: "👥" },
    { name: "Events", href: "/events", icon: "🎉" },
    { name: "Trucks", href: "/trucks", icon: "🚚" },
    { name: "Time-Off", href: "/requests", icon: "🌴" },
  ];

  return (
    <div className="landing-container">
      <main className="landing-main">
        <h1 className="landing-title">YYC Food Trucks</h1>
        <p className="landing-subtitle">
          Employee scheduling and management system
        </p>

        <div className="landing-links">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className={`
                landing-link 
                ${hoveredLink === index ? "bg-gray-100 scale-105 transition-transform" : ""}
              `}
              onMouseEnter={() => setHoveredLink(index)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <span className="landing-link-icon">{link.icon}</span>
              <span>{link.name}</span>
            </a>
          ))}
        </div>

        {/* Upcoming Events Section */}
        <section>
          <h2 className="section-title">Upcoming Events</h2>
          <div className="grid gap-4">
            {events.length > 0 ? (
              events.map((event, index) => (
                <div key={index} className="section-card">
                  <h3 className="section-card-title">{event.name}</h3>
                  <p className="section-card-text">
                    <strong>Date:</strong> {event.date}
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

        {/* Time-Off Requests Section */}
        <section>
          <h2 className="section-title">Time-Off Requests</h2>
          <div className="grid gap-4">
            {timeOffRequests.length > 0 ? (
              timeOffRequests.map((request, index) => (
                <div key={index} className="section-card">
                  <h3 className="section-card-title">{request.employeeName}</h3>
                  <p className="section-card-text">
                    <strong>Start Date:</strong> {request.startDate}
                  </p>
                  <p className="section-card-text">
                    <strong>End Date:</strong> {request.endDate}
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
      </main>
    </div>
  );
}
