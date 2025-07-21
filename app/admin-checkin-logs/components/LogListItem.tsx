import React from "react";
import { CheckinLog } from "@/app/types";

type LogType = "server" | "driver";

interface LogListItemProps {
  log: CheckinLog;
  type: LogType;
  formatTime: (dateStr?: string | null) => string;
  expectedStart?: string;
  expectedEnd?: string;
}

export default function LogListItem({
  log,
  type,
  formatTime,
  expectedStart,
  expectedEnd,
}: LogListItemProps) {
  return (
    <li className={`event-log-item ${type}`}>
      {" "}
      {/* .server or .driver */}
      <div className="name-row flex items-center gap-2 font-medium">
        <span className="name">
          {log.employee.first_name} {log.employee.last_name}
        </span>
        <span className="role">{log.employee.employee_type}</span>
        {type === "driver" && (
          <span className="truck">{log.assignment.truck_name || "-"}</span>
        )}
      </div>
      <div className="times">
        <span>
          Check-in:{" "}
          {log.clock_in_at ? (
            <span className="checkin">{formatTime(log.clock_in_at)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </span>
        <span>
          Check-out:{" "}
          {log.clock_out_at ? (
            <span className="checkout">{formatTime(log.clock_out_at)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </span>
      </div>
      {/* Expected check-in/out time */}
      {expectedStart && expectedEnd && (
        <div
          style={{
            color: "#6b7280",
            fontSize: "0.95rem",
            marginTop: "0.25rem",
          }}
        >
          Expected: {formatTime(expectedStart)} ~ {formatTime(expectedEnd)}
        </div>
      )}
      {/* Overtime display at the very bottom */}
      {(() => {
        if (log.clock_out_at && log.assignment.end_time) {
          let endStr = log.assignment.end_time;
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/.test(endStr))
            endStr += "Z";
          let outStr = log.clock_out_at;
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+$/.test(outStr))
            outStr += "Z";
          const end = new Date(endStr);
          const out = new Date(outStr);
          if (out > end) {
            const diffMs = out.getTime() - end.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor(
              (diffMs % (1000 * 60 * 60)) / (1000 * 60)
            );
            return (
              <div
                style={{
                  color: "#b91c1c",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  marginTop: "0.5rem",
                }}
              >
                Overtime: {hours.toString().padStart(2, "0")}hr{" "}
                {minutes.toString().padStart(2, "0")}min
              </div>
            );
          }
        }
        return null;
      })()}
    </li>
  );
}
