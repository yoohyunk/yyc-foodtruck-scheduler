import React from "react";
import { CheckinLog } from "@/app/types";
import { extractTime } from "@/app/events/utils";

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
          const inDate = new Date(log.clock_in_at);
          const outDate = new Date(log.clock_out_at);
          if (
            !isNaN(inDate.getTime()) &&
            !isNaN(outDate.getTime()) &&
            outDate > inDate
          ) {
            const diffMs = outDate.getTime() - inDate.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor(
              (diffMs % (1000 * 60 * 60)) / (1000 * 60)
            );
            return (
              <div
                style={{
                  color: "#2563eb",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  marginTop: "0.25rem",
                }}
              >
                Total: {hours.toString().padStart(2, "0")}hr{" "}
                {minutes.toString().padStart(2, "0")}min
              </div>
            );
          }
          return null;
        })()}
      {/* Overtime display at the very bottom */}
      {(() => {
        if (log.clock_out_at && log.assignment.end_time) {
          const end = new Date(log.assignment.end_time);
          const out = new Date(log.clock_out_at);
          // Only show overtime if dates are the same and out > end
          if (
            !isNaN(end.getTime()) &&
            !isNaN(out.getTime()) &&
            out > end &&
            end.toDateString() === out.toDateString()
          ) {
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
