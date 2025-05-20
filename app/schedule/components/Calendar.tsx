import dynamic from "next/dynamic";
import { EventContent } from "./EventContent";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    location: string;
    trucks: string[];
    assignedStaff: string[];
    requiredServers: number;
    startTime: string;
    endTime: string;
    status: "Scheduled" | "Pending";
  };
}

interface CalendarProps {
  viewMode: "daily" | "weekly" | "monthly";
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (eventId: string) => void;
}

export const Calendar = ({
  viewMode,
  selectedDate,
  events,
  onEventClick,
}: CalendarProps) => {
  const viewType =
    viewMode === "daily"
      ? "timeGridDay"
      : viewMode === "weekly"
        ? "timeGridWeek"
        : "dayGridMonth";

  return (
    <div className={`${viewMode}-schedule`}>
      <FullCalendar
        key={`${viewMode}-${selectedDate.toISOString()}`}
        plugins={plugins}
        initialView={viewType}
        initialDate={selectedDate}
        events={events}
        eventClick={(info) => {
          const eventId = info.event.id;
          if (eventId) {
            onEventClick(eventId);
          }
        }}
        eventContent={EventContent}
        height="auto"
        eventMinHeight={70}
        dayMaxEvents={3}
        headerToolbar={{
          left: "",
          center: "",
          right: "",
        }}
        dayHeaderFormat={{ weekday: "long", day: "numeric" }}
        dayCellClassNames="custom-day-cell"
        eventClassNames="custom-event-wrapper"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        slotLabelInterval="01:00"
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }}
        displayEventTime={true}
        displayEventEnd={true}
        allDaySlot={false}
        showNonCurrentDates={viewMode === "monthly"}
        fixedWeekCount={viewMode === "monthly"}
        dayMaxEventRows={viewMode === "monthly" ? false : 3}
        eventDisplay="block"
        eventOverlap={false}
        eventConstraint={{
          startTime: "00:00:00",
          endTime: "24:00:00",
          dows: [0, 1, 2, 3, 4, 5, 6],
        }}
      />
    </div>
  );
};
