"use client";
import "../globals.css";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Import FullCalendar and its plugins
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

// Import plugins
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Register plugins
const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];

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
            status:
              (event.assignedStaff?.length || 0) >= event.requiredServers
                ? "Scheduled"
                : "Pending",
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

  const renderCalendar = (): React.ReactElement => {
    const viewType =
      viewMode === "daily"
        ? "timeGridDay"
        : viewMode === "weekly"
          ? "timeGridWeek"
          : "dayGridMonth";

    const calendarEvents = getCalendarEvents();

    return (
      <div className={`${viewMode}-schedule`}>
        <FullCalendar
          key={`${viewMode}-${selectedDate.toISOString()}`}
          plugins={plugins}
          initialView={viewType}
          initialDate={selectedDate}
          events={calendarEvents}
          eventClick={(info) => {
            const eventId = info.event.id;
            if (eventId) {
              router.push(`/events/${eventId}`);
            }
          }}
          eventContent={(eventInfo) => (
            <div className="custom-event">
              <h3 className="custom-event-title text-primary-dark">
                {eventInfo.event.title}
              </h3>
              <p className="custom-event-time text-gray-500">
                {new Date(eventInfo.event.start!).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(eventInfo.event.end!).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="custom-event-location text-gray-500">
                {eventInfo.event.extendedProps.location}
              </p>
              <p
                className={`custom-event-status ${
                  eventInfo.event.extendedProps.status === "Scheduled"
                    ? "text-primary-medium"
                    : "text-gray-500"
                }`}
              >
                {eventInfo.event.extendedProps.status}
              </p>
            </div>
          )}
          height="auto"
          eventMinHeight={70}
          dayMaxEvents={3}
          headerToolbar={{
            left: "",
            center: "",
            right: "",
          }}
          dayHeaderFormat={{ weekday: "long", day: "numeric" }}
          dayCellClassNames="custom-day-cell"
          eventClassNames="custom-event-wrapper"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="01:00:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }}
          displayEventTime={true}
          displayEventEnd={true}
          allDaySlot={false}
          showNonCurrentDates={viewMode === "monthly"}
          fixedWeekCount={viewMode === "monthly"}
          dayMaxEventRows={viewMode === "monthly" ? false : 3}
          eventDisplay="block"
          eventOverlap={false}
          eventConstraint={{
            startTime: "00:00:00",
            endTime: "24:00:00",
            dows: [0, 1, 2, 3, 4, 5, 6],
          }}
        />
      </div>
    );
  };

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div>
          <h2 className="schedule-title text-primary-dark">Schedule</h2>
          <p className="schedule-subtitle text-gray-500">
            {getDateRangeText()}
          </p>
        </div>
        <div className="view-toggle-container">
          <button
            className={`view-toggle-button ${
              viewMode === "daily"
                ? "bg-primary-medium text-white"
                : "bg-secondary-dark text-primary-dark"
            }`}
            onClick={() => setViewMode("daily")}
          >
            Daily View
          </button>
          <button
            className={`view-toggle-button ${
              viewMode === "weekly"
                ? "bg-primary-medium text-white"
                : "bg-secondary-dark text-primary-dark"
            }`}
            onClick={() => setViewMode("weekly")}
          >
            Weekly View
          </button>
          <button
            className={`view-toggle-button ${
              viewMode === "monthly"
                ? "bg-primary-medium text-white"
                : "bg-secondary-dark text-primary-dark"
            }`}
            onClick={() => setViewMode("monthly")}
          >
            Monthly View
          </button>
        </div>
      </div>

      <div className="navigation-container">
        <button
          className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
          onClick={handlePrevious}
        >
          &larr; Previous
        </button>
        <button
          className="navigation-button bg-primary-medium text-white hover:bg-primary-dark"
          onClick={handleToday}
        >
          {viewMode === "daily"
            ? "Today"
            : viewMode === "weekly"
              ? "This Week"
              : "This Month"}
        </button>
        <button
          className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
          onClick={handleNext}
        >
          Next &rarr;
        </button>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <p className="text-primary-dark">Loading events...</p>
        </div>
      ) : (
        renderCalendar()
      )}
    </div>
  );
}
