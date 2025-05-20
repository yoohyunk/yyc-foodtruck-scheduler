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
  name: string;
  date: string;
  time: string;
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
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/events.json");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setEvents(data.events);
      } catch (error) {
        console.error("Error fetching events:", error);
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
    const filteredEvents = events.filter((event) => {
      const eventDate = new Date(event.date);

      if (viewMode === "daily") {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        return eventDate >= startOfDay && eventDate <= endOfDay;
      } else if (viewMode === "weekly") {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      }
      return true; // monthly view shows all events
    });

    console.log("Filtered events:", filteredEvents);
    return filteredEvents.map((event) => {
      const hasTrucks = Array.isArray(event.trucks) && event.trucks.length > 0;
      const hasEnoughStaff =
        Array.isArray(event.assignedStaff) &&
        event.assignedStaff.length >= event.requiredServers;
      const statusClass =
        hasTrucks && hasEnoughStaff ? "event_scheduled" : "event_pending";

      // Parse time string (e.g., "14:00" or "2:00 PM")
      const [timeStr, period] = event.time.split(" ");
      const [hours, minutes] = timeStr.split(":").map(Number);

      // Convert to 24-hour format if PM
      let adjustedHours = hours;
      if (period === "PM" && hours < 12) adjustedHours += 12;
      if (period === "AM" && hours === 12) adjustedHours = 0;

      // Create start and end dates
      const startDate = new Date(event.date);
      startDate.setHours(adjustedHours, minutes, 0, 0);

      // Assume event duration is 2 hours by default
      const endDate = new Date(startDate);
      endDate.setHours(adjustedHours + 2, minutes, 0, 0);

      return {
        id: event.id,
        title: event.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        className: statusClass,
        extendedProps: {
          time: event.time,
          location: event.location,
          trucks: event.trucks,
          assignedStaff: event.assignedStaff,
          requiredServers: event.requiredServers,
          status: statusClass === "event_scheduled" ? "Scheduled" : "Pending",
        },
      };
    });
  }, [events, selectedDate, viewMode]);

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
                {eventInfo.event.extendedProps.time}
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

      {renderCalendar()}
    </div>
  );
}
