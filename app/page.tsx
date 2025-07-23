"use client";
import "./globals.css";
import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { HomePageEvent, TimeOffRequest, Employee } from "./types";
import type { Tables } from "@/database.types";
import { TutorialOverlay } from "./tutorial";
import { useTutorial } from "./tutorial/TutorialContext";
import { TutorialHighlight } from "./components/TutorialHighlight";
import { eventsApi } from "@/lib/supabase/events";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { employeesApi } from "@/lib/supabase/employees";
import { useAuth } from "@/contexts/AuthContext";

export default function Home(): ReactElement {
  const [events, setEvents] = useState<HomePageEvent[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const { shouldHighlight } = useTutorial();

  // Clock animation effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const hourHand = document.getElementById("hour-hand");
      const minuteHand = document.getElementById("minute-hand");
      const secondHand = document.getElementById("second-hand");

      if (hourHand && minuteHand && secondHand) {
        const hourDegrees = hours * 30 + minutes * 0.5; // 30 degrees per hour + 0.5 degrees per minute
        const minuteDegrees = minutes * 6; // 6 degrees per minute
        const secondDegrees = seconds * 6; // 6 degrees per second

        hourHand.style.transform = `translate(-50%, -100%) rotate(${hourDegrees}deg)`;
        minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteDegrees}deg)`;
        secondHand.style.transform = `translate(-50%, -100%) rotate(${secondDegrees}deg)`;
      }
    };

    // Update immediately
    updateClock();

    // Update every second
    const interval = setInterval(updateClock, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    // Don't fetch events until auth is ready
    if (authLoading) {
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch upcoming events based on user role
        let eventsData: Array<{
          id: string;
          start_date: string;
          title?: string | null;
          description?: string | null;
          status?: string | null;
        }> = [];

        // Fetch events based on user role with better error handling
        try {
          if (isAdmin === true) {
            console.log("Fetching admin events...");
            // Admin: show only pending events
            const adminEvents = await eventsApi.getAllEvents();
            console.log("Admin events fetched:", adminEvents.length);
            eventsData = adminEvents
              .filter((event) => (event.status || "Pending") === "Pending")
              .map((event) => ({
                id: event.id,
                start_date: event.start_date || "",
                title: event.title,
                description: event.description,
                status: event.status,
              }));
            console.log("Filtered pending events:", eventsData.length);
          } else if (user?.id) {
            console.log("Fetching employee events for user:", user.id);
            // Employee: show only assigned events
            const response = await fetch(
              `/api/events/assigned?userId=${user.id}`
            );
            if (!response.ok) {
              throw new Error(
                `Failed to fetch assigned events: ${response.statusText}`
              );
            }
            const data = await response.json();
            console.log("Employee events response:", data);
            eventsData = (data.events || []).map(
              (event: Tables<"event_basic_info_view">) => ({
                id: event.id,
                start_date: event.start_date || "",
                title: event.title,
                description: event.description,
                status: event.status,
              })
            );
          } else {
            console.log("No user or admin status, setting empty events");
            eventsData = [];
          }
        } catch (eventsError) {
          console.error("Error fetching events:", eventsError);
          eventsData = [];
        }

        // Process upcoming events
        const upcomingEvents = eventsData
          .filter((event) => new Date(event.start_date) >= new Date())
          .slice(0, 6)
          .map((event) => ({
            id: event.id,
            title: event.title || "Untitled Event",
            startTime: new Date(event.start_date).toLocaleDateString(),
            location: event.description || "Location not set",
          }));

        setEvents(upcomingEvents);
        console.log("Set upcoming events:", upcomingEvents.length);

        // Fetch time-off requests with separate error handling
        try {
          console.log("Fetching time-off requests...");
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
          console.log("Set time-off requests:", upcomingRequests.length);
        } catch (requestsError) {
          console.error("Error fetching time-off requests:", requestsError);
          setTimeOffRequests([]);
        }

        // Fetch employees for name mapping with separate error handling
        try {
          console.log("Fetching employees...");
          const employeesData = await employeesApi.getAllEmployees();
          setEmployees(employeesData);
          console.log("Set employees:", employeesData.length);
        } catch (employeesError) {
          console.error("Error fetching employees:", employeesError);
          setEmployees([]);
        }
      } catch (error) {
        console.error("General error in fetchData:", error);
        setEvents([]);
        setTimeOffRequests([]);
        setEmployees([]);
      } finally {
        setIsLoading(false);
        console.log("Homepage loading complete");
      }
    };

    // Add a small delay to ensure auth state is stable
    const timeoutId = setTimeout(fetchData, 100);
    return () => clearTimeout(timeoutId);
  }, [isAdmin, user, authLoading]);

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId: string | null): string => {
    if (!employeeId) return "Unknown Employee";
    const employee = employees.find((emp) => emp.employee_id === employeeId);
    return employee
      ? `${employee.first_name} ${employee.last_name}`
      : "Unknown Employee";
  };

  return (
    <div className="landing-container">
      <TutorialOverlay />
      <main className="landing-main">
        <h1 className="landing-title">YYC Food Trucks</h1>
        <p className="landing-subtitle">
          Employee scheduling and management system
        </p>

        {/* Check-In Section - Non-Admin Only */}
        {!isAdmin && user && (
          <TutorialHighlight
            isHighlighted={shouldHighlight(".check-in-highlight")}
            className="check-in-highlight"
          >
            <section data-section="check-in">
              <h2 className="section-title">Check-In</h2>
              <div
                onClick={() => router.push("/check-in")}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "clamp(0.5rem, 2vw, 1rem)",
                  transition: "all 0.3s ease",
                  transform: "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Big Animated Clock */}
                <div
                  style={{
                    width: "clamp(120px, 25vw, 180px)",
                    height: "clamp(120px, 25vw, 180px)",
                    borderRadius: "50%",
                    border: "clamp(4px, 1vw, 8px) solid var(--primary-dark)",
                    position: "relative",
                    background: "linear-gradient(145deg, #f8f9fa, #e9ecef)",
                    boxShadow:
                      "inset 0 0 30px rgba(0, 0, 0, 0.1), 0 8px 25px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  {/* Clock Center */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "clamp(10px, 2vw, 16px)",
                      height: "clamp(10px, 2vw, 16px)",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-dark)",
                      transform: "translate(-50%, -50%)",
                      zIndex: 10,
                      boxShadow: "0 0 4px rgba(0, 0, 0, 0.2)",
                    }}
                  />

                  {/* Hour Hand */}
                  <div
                    id="hour-hand"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "clamp(5px, 1.5vw, 8px)",
                      height: "clamp(30px, 8vw, 45px)",
                      background:
                        "linear-gradient(to top, var(--primary-dark), #006666)",
                      transformOrigin: "bottom center",
                      transform: "translate(-50%, -100%) rotate(0deg)",
                      borderRadius: "clamp(2px, 0.5vw, 4px)",
                      zIndex: 8,
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                    }}
                  />

                  {/* Minute Hand */}
                  <div
                    id="minute-hand"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "clamp(3px, 1vw, 5px)",
                      height: "clamp(40px, 12vw, 65px)",
                      background:
                        "linear-gradient(to top, var(--primary-dark), #006666)",
                      transformOrigin: "bottom center",
                      transform: "translate(-50%, -100%) rotate(0deg)",
                      borderRadius: "clamp(1.5px, 0.4vw, 2.5px)",
                      zIndex: 9,
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                    }}
                  />

                  {/* Second Hand */}
                  <div
                    id="second-hand"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "clamp(1px, 0.5vw, 2px)",
                      height: "clamp(50px, 15vw, 75px)",
                      background: "linear-gradient(to top, #e74c3c, #c0392b)",
                      transformOrigin: "bottom center",
                      transform: "translate(-50%, -100%) rotate(0deg)",
                      zIndex: 7,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                    }}
                  />

                  {/* Clock Tick Marks */}
                  {Array.from({ length: 60 }, (_, i) => (
                    <div
                      key={`tick-${i}`}
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width:
                          i % 5 === 0
                            ? "clamp(2px, 0.5vw, 3px)"
                            : "clamp(0.5px, 0.2vw, 1px)",
                        height:
                          i % 5 === 0
                            ? "clamp(8px, 2vw, 12px)"
                            : "clamp(4px, 1vw, 6px)",
                        backgroundColor: "var(--primary-dark)",
                        transform: `translate(-50%, -50%) rotate(${i * 6}deg) translateY(-${i % 5 === 0 ? "clamp(50px, 12vw, 75px)" : "clamp(40px, 10vw, 60px)"})`,
                        transformOrigin: "center",
                        opacity: i % 5 === 0 ? 1 : 0.7,
                      }}
                    />
                  ))}

                  {/* Inner Ring */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "clamp(100px, 20vw, 160px)",
                      height: "clamp(100px, 20vw, 160px)",
                      borderRadius: "50%",
                      border: "1px solid rgba(0, 128, 128, 0.2)",
                      transform: "translate(-50%, -50%)",
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
            </section>
          </TutorialHighlight>
        )}

        {/* Upcoming Events Section */}
        <TutorialHighlight
          isHighlighted={shouldHighlight(".upcoming-events-highlight")}
          className="upcoming-events-highlight"
        >
          <section data-section="upcoming-events">
            <h2 className="section-title">
              {isAdmin ? "Upcoming Pending Events" : "Upcoming Events"}
            </h2>
            <div className="grid gap-4">
              {isLoading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading events...</p>
              ) : events.length > 0 ? (
                events.map((event, index) => (
                  <div
                    key={index}
                    className="section-card"
                    onClick={() => router.push(`/events/${event.id}`)}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 8px 25px rgba(0, 0, 0, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                  >
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
                <p style={{ color: "var(--text-muted)" }}>
                  {isAdmin
                    ? "No upcoming pending events."
                    : "No upcoming events."}
                </p>
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
                <p style={{ color: "var(--text-muted)" }}>
                  Loading requests...
                </p>
              ) : timeOffRequests.length > 0 ? (
                timeOffRequests.map((request, index) => (
                  <div key={index} className="section-card">
                    <h3 className="section-card-title">
                      {getEmployeeName(request.employee_id)}
                    </h3>
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
                        className="ml-2 px-2 py-1 rounded text-xs"
                        style={{
                          background:
                            request.status === "Approved"
                              ? "var(--success-light)"
                              : request.status === "Rejected"
                                ? "var(--error-light)"
                                : "var(--warning-light)",
                          color:
                            request.status === "Approved"
                              ? "var(--success-dark)"
                              : request.status === "Rejected"
                                ? "var(--error-dark)"
                                : "var(--warning-dark)",
                        }}
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
                <p style={{ color: "var(--text-muted)" }}>
                  No upcoming time-off requests.
                </p>
              )}
            </div>
          </section>
        </TutorialHighlight>
      </main>
    </div>
  );
}
