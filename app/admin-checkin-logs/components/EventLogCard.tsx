import React from "react";
import LogListSection from "./LogListSection";
import { CheckinLog } from "@/app/types";

interface EventLogCardProps {
  event: {
    id: string;
    title?: string;
    start_date?: string;
    end_date?: string;
  };
  serverLogs: CheckinLog[];
  driverLogs: CheckinLog[];
}

export default function EventLogCard({
  event,
  serverLogs,
  driverLogs,
}: EventLogCardProps) {
  // Function to get expected times for a log
  const getExpectedTimes = (log: CheckinLog) => {
    return {
      expectedStart: log.assignment.start_time,
      expectedEnd: log.assignment.end_time,
    };
  };

  return (
    <div className="event-log-card">
      <div className="event-log-header">
        <h3 className="event-title">{event.title || `Event ${event.id}`}</h3>
        <div className="event-times">
          {event.start_date && event.end_date && (
            <span>
              {new Date(event.start_date).toLocaleDateString()} -{" "}
              {new Date(event.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="event-log-content">
        <LogListSection
          type="server"
          logs={serverLogs}
          getExpectedTimes={getExpectedTimes}
        />
        <LogListSection
          type="driver"
          logs={driverLogs}
          getExpectedTimes={getExpectedTimes}
        />
      </div>
    </div>
  );
}
