"use client";
import "../globals.css";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ViewToggle } from "./components/ViewToggle";
import { Navigation } from "./components/Navigation";
import { Calendar } from "./components/Calendar";

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  trucks?: string[];
  assignedStaff?: string[];
  requiredServers: number;
}

export default function Schedule(): React.ReactElement {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/events.json", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          console.error("Received data is not an array:", data);
          setEvents([]);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
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
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek, { year: "numeric" })}`;
    } else {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return `${formatDate(firstDay)} - ${formatDate(lastDay, { year: "numeric" })}`;
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

  const getCalendarEvents = useCallback(() => {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    return events
      .map((event) => {
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);

        return {
          id: event.id,
          title: event.title,
          start: startDate,
          end: endDate,
          extendedProps: {
            location: event.location,
            trucks: event.trucks || [],
            assignedStaff: event.assignedStaff || [],
            requiredServers: event.requiredServers,
            startTime: event.startTime,
            endTime: event.endTime,
            status: ((event.assignedStaff?.length || 0) >= event.requiredServers
              ? "Scheduled"
              : "Pending") as "Scheduled" | "Pending",
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
      <div className="schedule-header">
        <div>
          <h2 className="schedule-title text-primary-dark">Schedule</h2>
          <p className="schedule-subtitle text-gray-500">
            {getDateRangeText()}
          </p>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      <Navigation
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />

      {isLoading ? (
        <div className="loading-container">
          <p className="text-primary-dark">Loading events...</p>
        </div>
      ) : (
        <Calendar
          viewMode={viewMode}
          selectedDate={selectedDate}
          events={getCalendarEvents()}
          onEventClick={handleEventClick}
        />
      )}
    </div>
  );
}
