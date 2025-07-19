"use client";
import "../globals.css";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ViewToggle } from "../schedule/components/ViewToggle";
import { Navigation } from "../schedule/components/Navigation";
import { Calendar, CalendarEvent } from "../schedule/components/Calendar";

import { assignmentsApi } from "@/lib/supabase/assignments";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";

export default function EmplpyeeSchedule(): React.ReactElement {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<
    Array<{
      id: string;
      employee_id?: string;
      driver_id?: string;
      event_id: string;
      start_date: string;
      end_date: string;
      event?: Tables<"events">;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        if (!user?.id) {
          setAssignments([]);
          return;
        }

        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("employee_id, employee_type")
          .eq("user_id", user.id)
          .single();

        if (employeeError || !employee) {
          console.error("No employee found for user");
          setAssignments([]);
          return;
        }

        const driverScheduleData =
          await assignmentsApi.getTruckAssignmentsByEmployeeId(
            employee.employee_id
          );

        const serverScheduleData =
          await assignmentsApi.getAssignmentsByEmployeeId(employee.employee_id);

        // Combine assignments and fetch event details
        const allAssignments = [...driverScheduleData, ...serverScheduleData];

        // Get unique event IDs
        const eventIds = [...new Set(allAssignments.map((a) => a.event_id))];

        // Fetch event details
        const { data: events } = await supabase
          .from("events")
          .select("id, title, description")
          .in("id", eventIds);

        // Create event map for quick lookup
        const eventMap = new Map();
        events?.forEach((event) => {
          eventMap.set(event.id, event);
        });

        // Add event details to assignments
        const assignmentsWithEvents = allAssignments.map((assignment) => ({
          ...assignment,
          event: eventMap.get(assignment.event_id),
        }));

        setAssignments(assignmentsWithEvents);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.id, supabase, authLoading]);

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
    if (!assignments || !Array.isArray(assignments)) {
      return [];
    }

    return assignments
      .filter(
        (assignment) =>
          assignment.start_date && assignment.end_date && assignment.id
      )
      .map((assignment) => {
        const startDate = new Date(assignment.start_date);
        const endDate = new Date(assignment.end_date);
        const status: "Scheduled" | "Pending" =
          assignment.event?.status === "Pending" ? "Pending" : "Scheduled";
        return {
          id: assignment.event_id || assignment.id,
          title: assignment.event?.title || "Assignment",
          start: startDate,
          end: endDate,
          extendedProps: {
            location: assignment.event?.description || "",
            trucks: [],
            assignedStaff: [],
            requiredServers: 0,
            startTime: assignment.start_date || "",
            endTime: assignment.end_date || "",
            status,
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
  }, [assignments, viewMode, selectedDate]);

  const handleEventClick = useCallback(
    (eventId: string) => {
      router.push(`/events/${eventId}`);
    },
    [router]
  );

  return (
    <div className="schedule-container">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="schedule-title text-primary-dark">Schedule</h2>
          <p className="schedule-subtitle text-gray-500">
            {getDateRangeText()}
          </p>
        </div>
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>
      <div className="flex flex-col gap-4">
        <Navigation
          viewMode={viewMode}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
      </div>
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

      <div className="mt-4">
        {/* This is where shifts would be displayed */}
        <p className="text-gray-500 text-center">
          No events scheduled for this period
        </p>
      </div>
    </div>
  );
}
