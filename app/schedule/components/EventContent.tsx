import { EventContentArg } from "@fullcalendar/core";

export const EventContent = (eventInfo: EventContentArg) => {
  return (
    <div className="custom-event">
      <h3 className="custom-event-title text-primary-dark">
        {eventInfo.event.title}
      </h3>
      <p className="custom-event-time text-gray-500">
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
      <p className="custom-event-location text-gray-500">
        {eventInfo.event.extendedProps.location}
      </p>
      <p
        className={`custom-event-status ${
          eventInfo.event.extendedProps.status === "Scheduled"
            ? "text-primary-medium"
            : "text-gray-500"
        }`}
      >
        {eventInfo.event.extendedProps.status}
      </p>
    </div>
  );
};
