"use client";
import "../globals.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DayPilotMonth } from "@daypilot/daypilot-lite-react";
import EventCard from "../infoCards/eventCard";

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

interface Truck {
  id: string;
  name: string;
  type: string;
  capacity: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface DayPilotEvent {
  id: string;
  text: string;
  start: string;
  end: string;
  data: Event & { status: string };
  cssClass: string;
}

const WEEKDAYS = useMemo(
  () => [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  []
);

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: options.year ? "numeric" : undefined,
    ...options,
  }).format(date);

export default function Schedule(): React.ReactElement {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


 useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, trucksRes, employeesRes] = await Promise.all([
          fetch("/events.json"),
          fetch("/trucks.json"),
          fetch("/employee.json"),
        ]);

        if (!eventsRes.ok || !trucksRes.ok || !employeesRes.ok)
          throw new Error("Fetch failed");

        const [eventsData, trucksData, employeesData] = await Promise.all([
          eventsRes.json(),
          trucksRes.json(),
          employeesRes.json(),
        ]);

        setEvents(eventsData);
        setTrucks(trucksData);
        setEmployees(employeesData);
        setLoading(false);
      } catch (err) {
        setError("Error fetching data.");
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const getDateRangeText = (): string => {
    if (viewMode === "weekly") {
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
    viewMode === "weekly"
      ? newDate.setDate(newDate.getDate() - 7)
      : newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const handleNext = useCallback(() => {
    const newDate = new Date(selectedDate);
    viewMode === "weekly"
      ? newDate.setDate(newDate.getDate() + 7)
      : newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  }, [selectedDate, viewMode]);

  const handleToday = useCallback(() => setSelectedDate(new Date()), []);

  const eventsThisWeek = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  }, [events, selectedDate]);

  const renderWeeklySchedule = (): React.ReactElement => {
    if (eventsThisWeek.length === 0) {
      return (
        <p className="empty-week-message">No events scheduled for this week.</p>
      );
    }

    return (
      <div className="weekly-schedule">
        {WEEKDAYS.map((day, index) => {
          const dailyEvents = eventsThisWeek.filter(
            (event) => new Date(event.date).getDay() === index
          );

           return (
            <div
              key={day}
              className={`day-card${dailyEvents.length ? " day-card-has-events" : ""}`}
            >
              <h3 className="day-title">{day}</h3>
              <div className="day-events-container">
                {dailyEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    trucks={trucks}
                    employees={employees}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlySchedule = (): React.ReactElement => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    const dayPilotEvents: DayPilotEvent[] = events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getMonth() === currentMonth &&
          eventDate.getFullYear() === currentYear
        );
      })
      .map((event) => {
        const hasTrucks =
          Array.isArray(event.trucks) && event.trucks.length > 0;
        const hasEnoughStaff =
          Array.isArray(event.assignedStaff) &&
          event.assignedStaff.length >= event.requiredServers;
        const statusClass =
          hasTrucks && hasEnoughStaff ? "event_scheduled" : "event_pending";

        return {
          id: event.id,
          text: event.name,
          start: event.date,
          end: event.date,
          data: { ...event, status: statusClass },
          cssClass: statusClass,
        };
      });

    return (
      <div className="monthly-schedule">
        <DayPilotMonth
          startDate={`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`}
          events={dayPilotEvents}
          onEventClick={({ e }) => {
            const clicked = events.find((event) => event.id === e.data.id);
            if (clicked) router.push(`/events/${clicked.id}`);
          }}
          onBeforeEventRender={(args: any) => {
            const eventData = args.data.data;
            const statusText =
              args.data.cssClass === "event_pending" ? "Pending" : "Scheduled";

            args.html = `
    <div class="custom-event">
      <h3 class="custom-event-title">${args.data.text}</h3>
      <p class="custom-event-time">${eventData.time}</p>
      <p class="custom-event-location">${eventData.location}</p>
      <p class="custom-event-status">${statusText}</p>
    </div>
  `;
          }}
          eventHeight={70}
          cellHeight={150}
          headerHeight={30}
        />
      </div>
    );
  };

  if (loading) return <p>Loading schedule...</p>;

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div>
          <h2 className="schedule-title">Schedule</h2>
          <p className="schedule-subtitle">{getDateRangeText()}</p>
        </div>
        <div className="view-toggle-container">
          <button
            className={`view-toggle-button ${viewMode === "weekly" ? "view-toggle-button-active" : ""}`}
            onClick={() => setViewMode("weekly")}
          >
            Weekly View
          </button>
          <button
            className={`view-toggle-button ${viewMode === "monthly" ? "view-toggle-button-active" : ""}`}
            onClick={() => setViewMode("monthly")}
          >
            Monthly View
          </button>
        </div>
      </div>

      <div className="navigation-container">
        <button className="navigation-button" onClick={handlePrevious}>
          &larr; Previous
        </button>
        <button
          className="navigation-button today-button"
          onClick={handleToday}
        >
          Today
        </button>
        <button className="navigation-button" onClick={handleNext}>
          Next &rarr;
        </button>
      </div>

      {viewMode === "weekly" ? renderWeeklySchedule() : renderMonthlySchedule()}
    </div>
  );
}
