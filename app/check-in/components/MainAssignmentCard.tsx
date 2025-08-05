import React from "react";
import { Assignment } from "@/app/types";
import { extractTime } from "@/app/events/utils";

interface MainAssignmentCardProps {
  assignment: Assignment;
  status: string;
  statusMessage: string;
  onCheckin: (assignment: Assignment) => void;
  onCheckout: (assignment: Assignment) => void;
  loading: boolean;
}

export default function MainAssignmentCard({
  assignment,
  status,
  statusMessage,
  onCheckin,
  onCheckout,
  loading,
}: MainAssignmentCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="event-log-item"
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          {assignment.type === "server" ? "Server" : "Driver"} Check-in
        </div>
        <div style={{ margin: "0.5rem 0" }}>
          <span style={{ fontWeight: 700 }}>
            {assignment.events?.title || "-"}
          </span>
          <div
            style={{
              fontSize: "0.9rem",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            {new Date(
              assignment.start_date || assignment.start_time || ""
            ).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <div style={{ fontSize: "1rem", marginTop: "0.25rem" }}>
            {extractTime(assignment.start_date || assignment.start_time || "")}{" "}
            - {extractTime(assignment.end_date || assignment.end_time || "")}
          </div>
        </div>
        {assignment.events?.address && (
          <div style={{ marginBottom: "1rem", color: "#374151" }}>
            <span>
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
            </span>
          </div>
        )}
        {assignment.type === "truck" && assignment.trucks?.name && (
          <div style={{ marginBottom: "1rem", color: "#374151" }}>
            <span>{assignment.trucks.name} truck</span>
          </div>
        )}
        <div
          className="event-log-section-header"
          style={{ marginBottom: "1rem" }}
        >
          <span>{statusMessage}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        {status === "ready" && (
          <button
            className="checkin"
            style={{
              padding: "0.5rem 1.5rem",
              background: "#2563eb",
              color: "#fff",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
            onClick={() => onCheckin(assignment)}
            disabled={loading}
          >
            Check In
          </button>
        )}
        {(status === "checked_in" || status === "overtime") && (
          <button
            className="checkout"
            style={{
              padding: "0.5rem 1.5rem",
              background: "#16a34a",
              color: "#fff",
              borderRadius: "0.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
            onClick={() => onCheckout(assignment)}
            disabled={loading}
          >
            Check Out
          </button>
        )}
      </div>
    </div>
  );
}
