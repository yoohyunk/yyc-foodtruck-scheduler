"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
// If you get a date-fns import error, run: npm install date-fns
import { format } from "date-fns";

// Types
interface Employee {
  employee_id: string;
  first_name?: string;
  last_name?: string;
  employee_type?: string;
}

interface AssignmentInfo {
  id: string;
  type: "server" | "truck";
  event_title?: string;
  truck_name?: string;
  start_time: string;
  end_time: string;
  event_id?: string;
}

interface CheckinLog {
  id: string;
  employee: Employee;
  assignment: AssignmentInfo;
  clock_in_at: string | null;
  clock_out_at: string | null;
}

interface EventInfo {
  id: string;
  title?: string;
}

function getTodayString() {
  return format(new Date(), "yyyy-MM-dd");
}

// Add formatTime helper from check-in/page.tsx
function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
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
              employees?: Employee;
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
              employees?: Employee;
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

  // 이벤트별로 그룹화
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

  // 이벤트 필터 적용
  const filteredEventIds = selectedEventId
    ? [selectedEventId]
    : Object.keys(logsByEvent);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        Employee Check-in/Check-out Logs
      </h1>
      <div className="mb-6 flex items-center gap-4 flex-wrap">
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
              return (
                <div
                  key={eventId}
                  className="bg-white rounded-xl shadow-sm p-6 mb-4"
                >
                  <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold mb-1 text-blue-800 flex items-center gap-2">
                        <span>📅</span>{" "}
                        {group.event.title || "(No Event Title)"}
                      </h2>
                      <div className="text-gray-500 text-sm">
                        {(() => {
                          const start = group.server.concat(group.truck)[0]
                            ?.assignment.start_time;
                          const end = group.server.concat(group.truck)[0]
                            ?.assignment.end_time;
                          console.log(
                            "EventCard start_time:",
                            start,
                            "end_time:",
                            end
                          );
                          return start ? (
                            <span>
                              {formatTime(start)} ~ {formatTime(end)}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm mt-2 md:mt-0">
                      <span className="bg-blue-100 text-blue-800 rounded px-2 py-1">
                        Server: {group.server.length}
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 rounded px-2 py-1">
                        Driver: {group.truck.length}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Server Section */}
                    <div>
                      <div className="bg-blue-50 rounded px-3 py-2 mb-2 font-semibold text-blue-900">
                        Server Logs
                      </div>
                      {group.server.length === 0 ? (
                        <div className="text-gray-400 italic py-4">
                          No server logs.
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {group.server.map((log) => (
                            <li
                              key={log.id}
                              className="bg-white rounded shadow-sm px-4 py-3 flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2 font-medium">
                                <span className="text-blue-700">
                                  {log.employee.first_name}{" "}
                                  {log.employee.last_name}
                                </span>
                                <span className="text-xs bg-blue-100 text-blue-800 rounded px-2 py-0.5 ml-2">
                                  {log.employee.employee_type}
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm mt-1">
                                <span>
                                  Check-in:{" "}
                                  {(() => {
                                    console.log(
                                      "Log clock_in_at:",
                                      log.clock_in_at,
                                      "clock_out_at:",
                                      log.clock_out_at
                                    );
                                    return null;
                                  })()}
                                  {log.clock_in_at ? (
                                    <span className="text-green-700">
                                      {formatTime(log.clock_in_at)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                                <span>
                                  Check-out:{" "}
                                  {log.clock_out_at ? (
                                    <span className="text-red-700">
                                      {formatTime(log.clock_out_at)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {/* Driver Section */}
                    <div>
                      <div className="bg-yellow-50 rounded px-3 py-2 mb-2 font-semibold text-yellow-900">
                        Driver Logs
                      </div>
                      {group.truck.length === 0 ? (
                        <div className="text-gray-400 italic py-4">
                          No driver logs.
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {group.truck.map((log) => (
                            <li
                              key={log.id}
                              className="bg-white rounded shadow-sm px-4 py-3 flex flex-col gap-1"
                            >
                              <div className="flex items-center gap-2 font-medium">
                                <span className="text-yellow-700">
                                  {log.employee.first_name}{" "}
                                  {log.employee.last_name}
                                </span>
                                <span className="text-xs bg-yellow-100 text-yellow-800 rounded px-2 py-0.5 ml-2">
                                  {log.employee.employee_type}
                                </span>
                                <span className="ml-2 text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">
                                  {log.assignment.truck_name || "-"}
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm mt-1">
                                <span>
                                  Check-in:{" "}
                                  {log.clock_in_at ? (
                                    <span className="text-green-700">
                                      {formatTime(log.clock_in_at)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                                <span>
                                  Check-out:{" "}
                                  {log.clock_out_at ? (
                                    <span className="text-red-700">
                                      {formatTime(log.clock_out_at)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
