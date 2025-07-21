"use client";
import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { EventContent } from "./EventContent";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin];

export interface CalendarEvent {
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
  const [isMobile, setIsMobile] = useState(false);

  // Single useEffect for responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Memoized view type calculation
  const viewType = useMemo(() => {
    if (isMobile || viewMode === "weekly") {
      return "listWeek";
    }

    switch (viewMode) {
      case "daily":
        return "timeGridDay";
      case "monthly":
        return "dayGridMonth";
      default:
        return "listWeek";
    }
  }, [isMobile, viewMode]);

  // Memoized calendar height
  const calendarHeight = useMemo(() => {
    return isMobile ? "600px" : "auto";
  }, [isMobile]);

  // Memoized header format to prevent duplicate headers
  const headerFormat = useMemo(
    () => ({
      weekday: (isMobile
        ? "short"
        : viewMode === "monthly"
          ? "short"
          : "long") as "short" | "long",
      day: "numeric" as const,
    }),
    [isMobile, viewMode]
  );

  // Memoized list view formats to prevent default FullCalendar headers
  const listFormats = useMemo(() => {
    if (isMobile || viewMode === "weekly") {
      return {
        listDayFormat: {
          month: "long" as const,
          day: "numeric" as const,
          weekday: "long" as const,
        },
        listDaySideFormat: {
          month: "long" as const,
          day: "numeric" as const,
          year: "numeric" as const,
        },
      };
    }
    return {};
  }, [isMobile, viewMode]);

  // Memoized aspect ratio
  const aspectRatio = useMemo(() => {
    if (isMobile || viewMode === "weekly") return 1.2;
    if (viewMode === "monthly") return 1.35;
    return 1.1;
  }, [isMobile, viewMode]);

  // Memoized container styles
  const containerStyles = useMemo(
    () => ({
      background: "var(--surface)",
      borderRadius: "0.75rem",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      padding: isMobile ? "0.25rem" : "0.5rem",
      overflow: "hidden",
      width: "100%",
      maxWidth: "100%",
    }),
    [isMobile]
  );

  const innerContainerStyles = useMemo(
    () => ({
      width: "100%",
      maxWidth: "100%",
      overflow: "hidden",
      minWidth: 0,
    }),
    []
  );

  return (
    <div className={`${viewMode}-schedule`} style={containerStyles}>
      <div style={innerContainerStyles}>
        <FullCalendar
          key={`${viewType}-${selectedDate.toISOString()}-${isMobile}`}
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
          height={calendarHeight}
          eventMinHeight={isMobile ? 40 : 60}
          headerToolbar={{
            left: "",
            center: "",
            right: "",
          }}
          dayHeaderFormat={headerFormat}
          dayCellClassNames="custom-day-cell"
          eventClassNames="custom-event-wrapper"
          allDaySlot={false}
          showNonCurrentDates={viewMode === "monthly" && !isMobile}
          fixedWeekCount={viewMode === "monthly" && !isMobile}
          eventOverlap={false}
          eventConstraint={{
            startTime: "00:00:00",
            endTime: "24:00:00",
            dows: [0, 1, 2, 3, 4, 5, 6],
          }}
          aspectRatio={aspectRatio}
          expandRows={!(isMobile || viewMode === "weekly")}
          handleWindowResize={true}
          windowResizeDelay={100}
          {...listFormats}
          eventContent={EventContent}
          // Disable event time display to prevent time/graphic columns
          displayEventTime={false}
          displayEventEnd={false}
        />
      </div>
    </div>
  );
};
