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
  const router = useRouter();
  const { shouldHighlight } = useTutorial();

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

  return (
    <div className="schedule-container">
      <TutorialHighlight
        isHighlighted={shouldHighlight(".schedule-header")}
        className="schedule-header"
      >
        <div>
          <h2
            className="schedule-title"
            style={{ color: "var(--primary-dark)" }}
          >
            Schedule
          </h2>
          <p
            className="schedule-subtitle"
            style={{ color: "var(--text-muted)" }}
          >
            {getDateRangeText()}
          </p>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </TutorialHighlight>

      <TutorialHighlight
        isHighlighted={shouldHighlight(".navigation-container")}
        className="navigation-container"
      >
        <Navigation
          viewMode={viewMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
      </TutorialHighlight>

      {isLoading ? (
        <div className="loading-container">
          <p className="text-primary-dark">Loading events...</p>
        </div>
      ) : (
        <TutorialHighlight
          isHighlighted={shouldHighlight(".monthly-schedule")}
          className="monthly-schedule"
        >
          <Calendar
            viewMode={viewMode}
            selectedDate={selectedDate}
            events={getCalendarEvents()}
            onEventClick={handleEventClick}
          />
        </TutorialHighlight>
      )}

      <TutorialHighlight
        isHighlighted={shouldHighlight(".shift-list")}
        className="shift-list"
      >
        <div className="mt-4">
          {/* This is where shifts would be displayed */}
          <p className="text-gray-500 text-center">
            No shift scheduled for this event
          </p>
        </div>
      </TutorialHighlight>
    </div>
  );
}
