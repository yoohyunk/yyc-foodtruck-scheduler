import React from "react";
import LogListSection from "./LogListSection";
import { CheckinLog } from "@/app/types";

interface EventInfo {
  id: string;
  title?: string;
}

interface EventInfoWithDates extends EventInfo {
  start_date?: string;
  end_date?: string;
}

interface EventLogCardProps {
  event: EventInfoWithDates;
  serverLogs: CheckinLog[];
  driverLogs: CheckinLog[];
  formatTime: (dateStr?: string | null) => string;
}

export default function EventLogCard({
  event,
  serverLogs,
  driverLogs,
  formatTime,
}: EventLogCardProps) {
  // Use event start/end for display only (directly from event)
  const eventStart = event.start_date;
  const eventEnd = event.end_date;
  return (
    <div className="event-log-card">
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1e40af",
              marginBottom: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            {event.title || "(No Event Title)"}
            {eventStart && eventEnd && (
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  color: "#374151",
                  marginLeft: "1rem",
                }}
              >
                {formatTime(eventStart)} ~ {formatTime(eventEnd)}
              </span>
            )}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.95rem" }}>
          <span
            style={{
              background: "#e0e7ff",
              color: "#1e40af",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.75rem",
            }}
          >
            Server: {serverLogs.length}
          </span>
          <span
            style={{
              background: "#fef9c3",
              color: "#a16207",
              borderRadius: "0.5rem",
              padding: "0.25rem 0.75rem",
            }}
          >
            Driver: {driverLogs.length}
          </span>
        </div>
      </div>
      <div className="event-log-card-grid">
        <LogListSection
          type="server"
          logs={serverLogs}
          formatTime={formatTime}
          getExpectedTimes={(log) => ({
            expectedStart: log.assignment.start_time,
            expectedEnd: log.assignment.end_time,
          })}
        />
        <LogListSection
          type="driver"
          logs={driverLogs}
          formatTime={formatTime}
          getExpectedTimes={(log) => ({
            expectedStart: log.assignment.start_time,
            expectedEnd: log.assignment.end_time,
          })}
        />
      </div>
    </div>
  );
}
