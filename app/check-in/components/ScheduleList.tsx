import React from "react";
import { Assignment, CheckinData } from "@/app/types";

interface ScheduleListProps {
  assignments: Assignment[];
  getStatusMessage: (status: string, assignment: Assignment) => string;
  getAssignmentStatus: (
    assignment: Assignment,
    checkinData: CheckinData
  ) => string;
  checkinMap: Record<string, CheckinData>;
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  let hours = d.getUTCHours() - 6;
  if (hours < 0) hours += 24;
  const minutes = d.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = ((hours + 11) % 12) + 1;
  return (
    displayHour.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    " " +
    ampm
  );
}

export default function ScheduleList({
  assignments,
  getStatusMessage,
  getAssignmentStatus,
  checkinMap,
}: ScheduleListProps) {
  return (
    <div className="event-log-list">
      <div
        className="event-log-section-header"
        style={{ marginBottom: "1rem" }}
      >
        Today&apos;s Schedule
      </div>
      <div>
        {assignments.map((assignment) => {
          const checkinData = checkinMap[`${assignment.type}_${assignment.id}`];
          const status = getAssignmentStatus(assignment, checkinData);
          return (
            <div
              key={assignment.type + assignment.id}
              className="event-log-item"
              style={{ marginBottom: "1.25rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <div
                    className="name"
                    style={{ fontWeight: 600, fontSize: "1.1rem" }}
                  >
                    {assignment.type === "server" ? "Server" : "Driver"} -{" "}
                    {assignment.events?.title || "-"}
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "#6b7280" }}>
                    {formatTime(assignment.start_date || assignment.start_time)}{" "}
                    - {formatTime(assignment.end_date || assignment.end_time)}
                  </div>
                  {assignment.type === "truck" && assignment.trucks?.name && (
                    <div
                      className="truck"
                      style={{ fontSize: "0.95rem", color: "#374151" }}
                    >
                      🚛 {assignment.trucks.name}
                    </div>
                  )}
                  {assignment.events?.address && (
                    <div
                      className="address"
                      style={{
                        fontSize: "0.95rem",
                        color: "#6b7280",
                        marginTop: "0.25rem",
                      }}
                    >
                      📍{" "}
                      {assignment.events.address.street &&
                        `${assignment.events.address.street}, `}
                      {assignment.events.address.city &&
                        `${assignment.events.address.city}, `}
                      {assignment.events.address.province &&
                        `${assignment.events.address.province} `}
                      {assignment.events.address.postal_code &&
                        `${assignment.events.address.postal_code}`}
                      {assignment.events.address.country &&
                        `, ${assignment.events.address.country}`}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    borderRadius: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    background:
                      status === "checked_in"
                        ? "#bbf7d0"
                        : status === "checked_out"
                          ? "#e5e7eb"
                          : status === "ready"
                            ? "#dbeafe"
                            : status === "overtime"
                              ? "#fef9c3"
                              : "#fee2e2",
                    color:
                      status === "checked_in"
                        ? "#15803d"
                        : status === "checked_out"
                          ? "#374151"
                          : status === "ready"
                            ? "#1e40af"
                            : status === "overtime"
                              ? "#a16207"
                              : "#b91c1c",
                  }}
                >
                  {status === "checked_in"
                    ? "Checked In"
                    : status === "checked_out"
                      ? "Checked Out"
                      : status === "ready"
                        ? "Ready"
                        : status === "overtime"
                          ? "Overtime"
                          : "Pending"}
                </span>
              </div>
              <div
                className="times"
                style={{ fontSize: "0.95rem", color: "#6b7280" }}
              >
                {getStatusMessage(status, assignment)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
