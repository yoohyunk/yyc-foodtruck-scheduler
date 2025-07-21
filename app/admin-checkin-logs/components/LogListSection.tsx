import React from "react";
import LogListItem from "./LogListItem";
import { CheckinLog } from "@/app/types";

type LogType = "server" | "driver";

interface LogListSectionProps {
  type: LogType;
  logs: CheckinLog[];
  formatTime: (dateStr?: string | null) => string;
  getExpectedTimes?: (log: CheckinLog) => {
    expectedStart?: string;
    expectedEnd?: string;
  };
}

export default function LogListSection({
  type,
  logs,
  getExpectedTimes,
}: LogListSectionProps) {
  return (
    <div>
      <div
        className={`event-log-section-header${type === "driver" ? " driver" : ""}`}
      >
        {type === "server" ? "Server Logs" : "Driver Logs"}
      </div>
      {logs.length === 0 ? (
        <div className="text-gray-400 italic py-4">No {type} logs.</div>
      ) : (
        <ul className="event-log-list">
          {logs.map((log) => {
            const expected = getExpectedTimes ? getExpectedTimes(log) : {};
            return (
              <LogListItem
                key={log.id}
                log={log}
                type={type}
                expectedStart={expected.expectedStart}
                expectedEnd={expected.expectedEnd}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
