import { EventContentArg } from "@fullcalendar/core";

export const EventContent = (eventInfo: EventContentArg) => {
  const isList = eventInfo.view.type.includes("list");

  if (isList) {
    // List view layout for mobile
    return (
      <div
        className="custom-event"
        style={{
          padding: "1rem",
          borderRadius: "0.75rem",
          background: "var(--surface)",
          boxShadow: "0 4px 8px rgba(0, 128, 157, 0.15)",
          fontSize: "0.875rem",
          lineHeight: "1.4",
          border: "2px solid var(--primary-light)",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Event indicator bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            background: "var(--primary-dark)",
            borderRadius: "2px",
          }}
        />
        <h3
          className="custom-event-title"
          style={{
            fontSize: "1.125rem",
            fontWeight: "700",
            marginBottom: "0.75rem",
            color: "var(--text-primary)",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            lineHeight: "1.3",
            paddingLeft: "0.5rem",
          }}
        >
          {eventInfo.event.title}
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "1rem",
            paddingLeft: "0.5rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            className="custom-event-time"
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              fontWeight: "600",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              background: "var(--background-light)",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              minWidth: "fit-content",
              border: "1px solid var(--border)",
            }}
          >
            🕒{" "}
            {new Date(eventInfo.event.start!).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            -{" "}
            {new Date(eventInfo.event.end!).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          {eventInfo.event.extendedProps && (
            <>
              <div
                className="custom-event-location"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                  lineHeight: "1.3",
                  background: "var(--surface)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "fit-content",
                  border: "1px solid var(--border)",
                }}
              >
                📍 {eventInfo.event.extendedProps.location}
              </div>
              <div
                className="custom-event-status"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--white)",
                  fontWeight: "600",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  background:
                    eventInfo.event.extendedProps.status === "Scheduled"
                      ? "var(--primary-dark)"
                      : "var(--text-muted)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "fit-content",
                }}
              >
                {eventInfo.event.extendedProps.status}
              </div>
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
        boxShadow: "0 2px 4px rgba(0, 128, 157, 0.1)",
        fontSize: "0.75rem",
        lineHeight: "1.2",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        border: "1px solid var(--primary-light)",
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
                  ? "var(--primary-dark)"
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
