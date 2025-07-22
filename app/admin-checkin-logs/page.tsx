"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
// If you get a date-fns import error, run: npm install date-fns
import { format } from "date-fns";
import EventLogCard from "./components/EventLogCard";
import { CheckinLog, CheckinEmployee } from "../types";

// Types

interface EventInfo {
  id: string;
  title?: string;
  start_date?: string;
  end_date?: string;
}

function getTodayString() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function AdminCheckinLogsPage() {
  const [date, setDate] = useState(getTodayString());
  const [logs, setLogs] = useState<CheckinLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Fetch events for the selected date
  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date, end_date")
        .gte("start_date", `${date}T00:00:00`)
        .lte("end_date", `${date}T23:59:59`);
      if (!error && data) {
        setEvents(data);
        setSelectedEventId(""); // Reset event filter on date change
      } else {
        setEvents([]);
      }
    }
    fetchEvents();
  }, [date]);

  // Fetch logs for the selected date
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      // Fetch server assignment logs
      const { data: serverLogs, error: serverError } = await supabase
        .from("server_assignment_clockin")
        .select(
          `
          *,
          assignments:assignment_id(
            id, start_date, end_date, event_id, events(title), employees(employee_id, first_name, last_name, employee_type)
          )
        `
        )
        .gte("clock_in_at", `${date}T00:00:00`)
        .lte("clock_in_at", `${date}T23:59:59`);

      // Fetch truck assignment logs
      const { data: truckLogs, error: truckError } = await supabase
        .from("truck_assignment_checkin")
        .select(
          `
          *,
          truck_assignment:assignment_id(
            id, start_time, end_time, event_id, events(title), trucks(name), employees(employee_id, first_name, last_name, employee_type)
          )
        `
        )
        .gte("clock_in_at", `${date}T00:00:00`)
        .lte("clock_in_at", `${date}T23:59:59`);

      if (serverError || truckError) {
        setError("Failed to fetch logs");
        setLoading(false);
        return;
      }

      // Normalize data
      const normalizedServerLogs: CheckinLog[] = (serverLogs || []).map(
        (log: unknown) => {
          const l = log as {
            id: string;
            assignments?: {
              id: string;
              event_id?: string;
              events?: { title?: string };
              employees?: CheckinEmployee;
              start_date?: string;
              end_date?: string;
            };
            assignment_id: string;
            clock_in_at: string | null;
            clock_out_at: string | null;
          };
          const emp = l.assignments?.employees;
          return {
            id: l.id,
            employee: emp
              ? { ...emp, employee_id: emp.employee_id || "" }
              : { employee_id: "" },
            assignment: {
              id: l.assignment_id,
              type: "server",
              event_title: l.assignments?.events?.title,
              start_time: l.assignments?.start_date || "",
              end_time: l.assignments?.end_date || "",
              event_id: l.assignments?.event_id || "",
            },
            clock_in_at: l.clock_in_at,
            clock_out_at: l.clock_out_at,
          };
        }
      );
      const normalizedTruckLogs: CheckinLog[] = (truckLogs || []).map(
        (log: unknown) => {
          const l = log as {
            id: string;
            truck_assignment?: {
              id: string;
              event_id?: string;
              events?: { title?: string };
              trucks?: { name?: string };
              employees?: CheckinEmployee;
              start_time?: string;
              end_time?: string;
            };
            assignment_id: string;
            clock_in_at: string | null;
            clock_out_at: string | null;
          };
          const emp = l.truck_assignment?.employees;
          return {
            id: l.id,
            employee: emp
              ? { ...emp, employee_id: emp.employee_id || "" }
              : { employee_id: "" },
            assignment: {
              id: l.assignment_id,
              type: "truck",
              event_title: l.truck_assignment?.events?.title,
              truck_name: l.truck_assignment?.trucks?.name,
              start_time: l.truck_assignment?.start_time || "",
              end_time: l.truck_assignment?.end_time || "",
              event_id: l.truck_assignment?.event_id || "",
            },
            clock_in_at: l.clock_in_at,
            clock_out_at: l.clock_out_at,
          };
        }
      );
      setLogs([...normalizedServerLogs, ...normalizedTruckLogs]);
      setLoading(false);
    }
    fetchLogs();
  }, [date]);

  // Group by event
  const logsByEvent: Record<
    string,
    { event: EventInfo; server: CheckinLog[]; truck: CheckinLog[] }
  > = {};
  logs.forEach((log) => {
    const eventId = log.assignment.event_id || "no_event";
    if (!logsByEvent[eventId]) {
      const eventInfo = events.find((e) => e.id === eventId) || {
        id: eventId,
        title: log.assignment.event_title,
      };
      logsByEvent[eventId] = { event: eventInfo, server: [], truck: [] };
    }
    if (log.assignment.type === "server") logsByEvent[eventId].server.push(log);
    else logsByEvent[eventId].truck.push(log);
  });

  // Apply event filter
  const filteredEventIds = selectedEventId
    ? [selectedEventId]
    : Object.keys(logsByEvent);

  // Debug logs for diagnosis

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold" style={{ marginBottom: "2rem" }}>
        Employee Check-in/Check-out Logs
      </h1>
      <div
        className="mb-6 filter-row"
        style={{
          marginBottom: "2rem",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "nowrap",
        }}
      >
        <label htmlFor="date" className="font-medium">
          Date:
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        {events.length > 0 && (
          <>
            <label htmlFor="event" className="font-medium ml-4">
              Event:
            </label>
            <select
              id="event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title || event.id}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredEventIds.length === 0 ? (
            <div>No logs found for this date.</div>
          ) : (
            filteredEventIds.map((eventId) => {
              const group = logsByEvent[eventId];
              const eventInfo =
                events.find((e) => e.id === eventId) || group.event;

              return (
                <EventLogCard
                  key={eventId}
                  event={eventInfo}
                  serverLogs={group.server}
                  driverLogs={group.truck}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
