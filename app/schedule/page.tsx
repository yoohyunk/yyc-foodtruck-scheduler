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
import { assignmentsApi } from "@/lib/supabase/assignments";
import { createClient } from "@/lib/supabase/client";

export default function Schedule(): React.ReactElement {
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch events
        const eventsData = await eventsApi.getAllEvents();
        setEvents(eventsData);

        // Fetch all assignments (shifts)
        const { data: assignmentsData, error } = await supabase
          .from("assignments")
          .select(`
            *,
            employees (
              first_name,
              last_name,
              employee_type
            )
          `)
          .is("event_id", null); // Only get standalone shifts (not event assignments)

        if (error) {
          console.error("Error fetching assignments:", error);
          setAssignments([]);
        } else {
          setAssignments(assignmentsData || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setEvents([]);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    const calendarEvents: CalendarEvent[] = [];

    // Add events
    if (events && Array.isArray(events)) {
      events
        .filter((event) => event.start_date && event.end_date && event.id)
        .forEach((event) => {
          const startDate = new Date(event.start_date!);
          const endDate = new Date(event.end_date!);

          calendarEvents.push({
            id: event.id,
            title: event.title || "Untitled Event",
            start: startDate,
            end: endDate,
            extendedProps: {
              location: event.description || "N/A",
              trucks: [],
              assignedStaff: [],
              requiredServers: event.number_of_servers_needed || 0,
              startTime: event.start_date || "",
              endTime: event.end_date || "",
              status: "Pending" as "Pending" | "Scheduled",
              type: "event",
            },
          });
        });
    }

    // Add shifts (assignments)
    if (assignments && Array.isArray(assignments)) {
      assignments
        .filter((assignment) => assignment.start_date && assignment.end_date && assignment.id)
        .forEach((assignment) => {
          const startDate = new Date(assignment.start_date);
          const endDate = new Date(assignment.end_date);
          const employee = assignment.employees;

          calendarEvents.push({
            id: `shift-${assignment.id}`,
            title: `Shift: ${employee?.first_name} ${employee?.last_name}`,
            start: startDate,
            end: endDate,
            extendedProps: {
              location: "Standalone Shift",
              trucks: [],
              assignedStaff: [employee?.first_name + " " + employee?.last_name],
              requiredServers: 0,
              startTime: assignment.start_date,
              endTime: assignment.end_date,
              status: "Scheduled" as "Pending" | "Scheduled",
              type: "shift",
              employeeType: employee?.employee_type,
            },
          });
        });
    }

    // Filter by view mode
    return calendarEvents.filter((event) => {
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
  }, [events, assignments, viewMode, selectedDate]);

  const handleEventClick = useCallback(
    (eventId: string) => {
      if (eventId.startsWith("shift-")) {
        // Handle shift click - could redirect to shift details or employee schedule
        router.push("/employee-schedule");
      } else {
        // Handle event click
        router.push(`/events/${eventId}`);
      }
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
          <p className="text-primary-dark">Loading events and shifts...</p>
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
          <p className="text-gray-500 text-center">
            {assignments.length > 0 
              ? `${assignments.length} shift(s) scheduled` 
              : "No shifts scheduled"}
          </p>
        </div>
      </TutorialHighlight>
    </div>
  );
}
