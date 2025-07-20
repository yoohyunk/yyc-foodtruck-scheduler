import { EventContentArg } from "@fullcalendar/core";

export const EventContent = (eventInfo: EventContentArg) => {
  const isList = eventInfo.view.type.includes("list");

  if (isList) {
    // List view layout for mobile
    return (
      <div
        className="custom-event"
        style={{
          padding: "0.75rem",
          borderRadius: "0.5rem",
          background: "var(--surface)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          fontSize: "0.875rem",
          lineHeight: "1.4",
          border: "1px solid var(--border)",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <h3
          className="custom-event-title"
          style={{
            fontSize: "1rem",
            fontWeight: "600",
            marginBottom: "0.5rem",
            color: "var(--text-primary)",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            lineHeight: "1.3",
          }}
        >
          {eventInfo.event.title}
        </h3>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <p
            className="custom-event-time"
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: "500",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {new Date(eventInfo.event.start!).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(eventInfo.event.end!).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {eventInfo.event.extendedProps && (
            <>
              <p
                className="custom-event-location"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                  lineHeight: "1.3",
                }}
              >
                📍 {eventInfo.event.extendedProps.location}
              </p>
              <p
                className="custom-event-status"
                style={{
                  fontSize: "0.875rem",
                  color:
                    eventInfo.event.extendedProps.status === "Scheduled"
                      ? "var(--primary-medium)"
                      : "var(--text-muted)",
                  fontWeight: "500",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                Status: {eventInfo.event.extendedProps.status}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Grid view layout for desktop
  return (
    <div
      className="custom-event"
      style={{
        padding: "0.25rem",
        borderRadius: "0.25rem",
        background: "var(--surface)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        fontSize: "0.75rem",
        lineHeight: "1.2",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <h3
        className="custom-event-title"
        style={{
          fontSize: "0.875rem",
          fontWeight: "600",
          marginBottom: "0.125rem",
          color: "var(--text-primary)",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          hyphens: "auto",
          lineHeight: "1.2",
        }}
      >
        {eventInfo.event.title}
      </h3>
      <p
        className="custom-event-time"
        style={{
          fontSize: "0.75rem",
          marginBottom: "0.125rem",
          color: "var(--text-secondary)",
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {new Date(eventInfo.event.start!).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        -{" "}
        {new Date(eventInfo.event.end!).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      {eventInfo.event.extendedProps && (
        <>
          <p
            className="custom-event-location"
            style={{
              fontSize: "0.75rem",
              marginBottom: "0.125rem",
              color: "var(--text-secondary)",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
              lineHeight: "1.2",
            }}
          >
            {eventInfo.event.extendedProps.location}
          </p>
          <p
            className="custom-event-status"
            style={{
              fontSize: "0.75rem",
              color:
                eventInfo.event.extendedProps.status === "Scheduled"
                  ? "var(--primary-medium)"
                  : "var(--text-muted)",
              wordWrap: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {eventInfo.event.extendedProps.status}
          </p>
        </>
      )}
    </div>
  );
};
