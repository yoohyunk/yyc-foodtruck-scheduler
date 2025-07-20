"use client";
import "../globals.css";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ViewToggle } from "./components/ViewToggle";
import { Navigation } from "./components/Navigation";
import { Calendar, CalendarEvent } from "./components/Calendar";
import { Event } from "../types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { eventsApi } from "@/lib/supabase/events";

export default function Schedule(): React.ReactElement {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileNotice, setShowMobileNotice] = useState(false);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Show notice if switching from desktop to mobile with monthly view
      if (mobile && viewMode === "monthly") {
        setShowMobileNotice(true);
        setTimeout(() => setShowMobileNotice(false), 3000); // Hide after 3 seconds
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [viewMode]);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventsApi.getAllEvents();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}) =>
    new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: options.year ? "numeric" : undefined,
      ...options,
    }).format(date);

  const getDateRangeText = (): string => {
    if (viewMode === "daily") {
      return formatDate(selectedDate, { year: "numeric" });
    } else if (viewMode === "weekly") {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek, {
        year: "numeric",
      })}`;
    } else {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return `${formatDate(firstDay)} - ${formatDate(lastDay, {
        year: "numeric",
      })}`;
    }
  };

  const handlePrevious = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === "weekly") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (viewMode === "daily") {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === "weekly") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const handleToday = useCallback(() => {
    const today = new Date();
    if (viewMode === "weekly") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setSelectedDate(startOfWeek);
    } else if (viewMode === "monthly") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setSelectedDate(startOfMonth);
    } else {
      setSelectedDate(today);
    }
  }, [viewMode]);

  const getCalendarEvents = useCallback((): CalendarEvent[] => {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events
      .filter((event) => event.start_date && event.end_date && event.id)
      .map((event) => {
        const startDate = new Date(event.start_date!);
        const endDate = new Date(event.end_date!);

        return {
          id: event.id,
          title: event.title || "Untitled Event",
          start: startDate,
          end: endDate,
          extendedProps: {
            location: event.description || "N/A",
            // The following are placeholders as we don't have this data yet
            trucks: [],
            assignedStaff: [],
            requiredServers: event.number_of_servers_needed || 0,
            startTime: event.start_date || "",
            endTime: event.end_date || "",
            status: "Pending" as "Pending" | "Scheduled",
          },
        };
      })
      .filter((event) => {
        const eventDate = new Date(event.start);

        if (viewMode === "daily") {
          return (
            eventDate.getDate() === selectedDate.getDate() &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getFullYear() === selectedDate.getFullYear()
          );
        } else if (viewMode === "weekly") {
          const weekStart = new Date(selectedDate);
          weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          const weekEnd = new Date(selectedDate);
          weekEnd.setDate(selectedDate.getDate() + 6);
          return eventDate >= weekStart && eventDate <= weekEnd;
        }
        return true; // monthly view shows all events
      });
  }, [events, viewMode, selectedDate]);

  const handleEventClick = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router]
  );

  const handleViewChange = useCallback(
    (newViewMode: "daily" | "weekly" | "monthly") => {
      // Don't allow monthly view on mobile
      if (isMobile && newViewMode === "monthly") {
        return;
      }
      setViewMode(newViewMode);
    },
    [isMobile]
  );

  return (
    <div
      className="schedule-container"
      style={{
        padding: isMobile ? "0.5rem" : "1rem",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Mobile Notice */}
      {showMobileNotice && (
        <div
          style={{
            background: "var(--primary-light)",
            color: "var(--primary-dark)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: "500",
            border: "1px solid var(--primary-medium)",
          }}
        >
          📱 Switched to daily view - monthly view not available on mobile
        </div>
      )}

      <TutorialHighlight
        isHighlighted={shouldHighlight(".schedule-header")}
        className="schedule-header"
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "1rem",
          marginBottom: "1.5rem",
          alignItems: isMobile ? "center" : "space-between",
        }}
      >
        <div style={{ textAlign: isMobile ? "center" : "left" }}>
          <h2
            className="schedule-title"
            style={{
              color: "var(--primary-dark)",
              fontSize: isMobile ? "1.5rem" : "1.75rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            Schedule
          </h2>
          <p
            className="schedule-subtitle"
            style={{
              color: "var(--text-muted)",
              fontSize: isMobile ? "0.875rem" : "1rem",
              fontWeight: "500",
            }}
          >
            {getDateRangeText()}
          </p>
          {isMobile && (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                marginTop: "0.5rem",
                fontStyle: "italic",
              }}
            >
              📱 Mobile view: Events shown in list format
            </p>
          )}
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={handleViewChange} />
      </TutorialHighlight>

      <TutorialHighlight
        isHighlighted={shouldHighlight(".navigation-container")}
        className="navigation-container"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <Navigation
          viewMode={viewMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
      </TutorialHighlight>

      {isLoading ? (
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "2rem",
            background: "var(--surface)",
            borderRadius: "1rem",
            border: "2px solid var(--border)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p style={{ color: "var(--text-primary)" }}>Loading events...</p>
          </div>
        </div>
      ) : (
        <TutorialHighlight
          isHighlighted={shouldHighlight(".monthly-schedule")}
          className="monthly-schedule"
          style={{
            background: "var(--surface)",
            borderRadius: "1rem",
            border: "2px solid var(--border)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            padding: isMobile ? "0.5rem" : "1rem",
            overflow: "hidden",
          }}
        >
          <Calendar
            viewMode={viewMode}
            selectedDate={selectedDate}
            events={getCalendarEvents()}
            onEventClick={handleEventClick}
          />
        </TutorialHighlight>
      )}
    </div>
  );
}
