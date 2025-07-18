"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { EventContent } from "./EventContent";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin];

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
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const viewType =
    viewMode === "daily"
      ? "timeGridDay"
      : viewMode === "weekly"
        ? "dayGridWeek"
        : "dayGridMonth";

  // Responsive configurations based on screen size
  const getResponsiveConfig = () => {
    if (isMobile) {
      return {
        eventMinHeight: 40,
        dayMaxEvents: 2,
        slotDuration: "02:00:00",
        slotLabelInterval: "02:00",
        dayMaxEventRows: 2,
        aspectRatio: 0.6,
        fontSize: "10px",
        padding: "1px 2px",
      };
    } else if (isTablet) {
      return {
        eventMinHeight: 55,
        dayMaxEvents: 3,
        slotDuration: "01:30:00",
        slotLabelInterval: "01:30",
        dayMaxEventRows: 3,
        aspectRatio: 1.0,
        fontSize: "12px",
        padding: "2px 4px",
      };
    } else {
      return {
        eventMinHeight: 70,
        dayMaxEvents: 4,
        slotDuration: "01:00:00",
        slotLabelInterval: "01:00",
        dayMaxEventRows: 4,
        aspectRatio: 1.35,
        fontSize: "14px",
        padding: "4px 6px",
      };
    }
  };

  const config = getResponsiveConfig();

  return (
    <div className={`${viewMode}-schedule mobile-calendar responsive-calendar`}>
      <FullCalendar
        key={`${viewMode}-${selectedDate.toISOString()}-${isMobile ? "mobile" : isTablet ? "tablet" : "desktop"}`}
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
        eventMinHeight={config.eventMinHeight}
        dayMaxEvents={config.dayMaxEvents}
        headerToolbar={{
          left: "",
          center: "",
          right: "",
        }}
        dayHeaderFormat={{ weekday: "long", day: "numeric" }}
        dayHeaderContent={({ date }) => {
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const dayNum = date.getDate();
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div>{dayNum}</div>
              <div>{dayName}</div>
            </div>
          );
        }}
        dayCellClassNames="custom-day-cell"
        eventClassNames="custom-event-wrapper"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration={config.slotDuration}
        slotLabelInterval={config.slotLabelInterval}
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
        dayMaxEventRows={
          viewMode === "monthly" ? false : config.dayMaxEventRows
        }
        eventDisplay="block"
        eventOverlap={false}
        firstDay={1}
        aspectRatio={config.aspectRatio}
        handleWindowResize={true}
        windowResizeDelay={100}
        eventConstraint={{
          startTime: "00:00:00",
          endTime: "24:00:00",
          dows: [0, 1, 2, 3, 4, 5, 6],
        }}
        // Responsive event rendering
        eventDidMount={(info) => {
          info.el.style.fontSize = config.fontSize;
          info.el.style.padding = config.padding;
          if (isMobile) {
            info.el.style.cursor = "pointer";
          }
        }}
        // Touch-friendly interactions
        selectable={true}
        selectMirror={true}
        unselectAuto={true}
        // Better mobile navigation
        navLinks={true}
        moreLinkClick="popover"
      />
    </div>
  );
};
