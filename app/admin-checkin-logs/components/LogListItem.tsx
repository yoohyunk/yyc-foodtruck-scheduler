import React from "react";
import { CheckinLog } from "@/app/types";
import { extractTime } from "@/app/events/utils";
import { calculateTimeDifference } from "../../check-in/utils";

type LogType = "server" | "driver";

interface LogListItemProps {
  log: CheckinLog;
  type: LogType;
  expectedStart?: string;
  expectedEnd?: string;
}

export default function LogListItem({
  log,
  type,
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
            <span className="checkin">{extractTime(log.clock_in_at)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </span>
        <span>
          Check-out:{" "}
          {log.clock_out_at ? (
            <span className="checkout">{extractTime(log.clock_out_at)}</span>
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
          Expected: {extractTime(expectedStart)} ~ {extractTime(expectedEnd)}
        </div>
      )}
      {/* Total hours worked */}
      {log.clock_in_at &&
        log.clock_out_at &&
        (() => {
          const totalTime = calculateTimeDifference(
            log.clock_in_at,
            log.clock_out_at
          );
          if (totalTime) {
            return (
              <div
                style={{
                  color: "#2563eb",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                }}
              >
                Total: {totalTime.hours.toString().padStart(2, "0")}hr{" "}
                {totalTime.minutes.toString().padStart(2, "0")}min
              </div>
            );
          }
          return null;
        })()}
      {/* Overtime display at the very bottom */}
      {(() => {
        if (log.clock_out_at && log.assignment.end_time) {
          const overtimeTime = calculateTimeDifference(
            log.assignment.end_time,
            log.clock_out_at
          );
          if (
            overtimeTime &&
            overtimeTime.hours >= 0 &&
            overtimeTime.minutes >= 0
          ) {
            return (
              <div
                style={{
                  color: "#b91c1c",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  marginTop: "0.5rem",
                }}
              >
                Overtime: {overtimeTime.hours.toString().padStart(2, "0")}hr{" "}
                {overtimeTime.minutes.toString().padStart(2, "0")}min
              </div>
            );
          }
        }
        return null;
      })()}
    </li>
  );
}
