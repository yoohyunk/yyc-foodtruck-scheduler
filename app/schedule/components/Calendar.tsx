"use client";
import React, { useEffect, useState } from "react";
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
  extendedProps?: {
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
  const [calendarHeight, setCalendarHeight] = useState("auto");

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCalendarHeight(mobile ? "600px" : "auto");
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Determine the best view for mobile vs desktop
  const getViewType = () => {
    if (isMobile) {
      // On mobile, use list view for better readability
      return "listWeek";
    }
    
    // Desktop views
    switch (viewMode) {
      case "daily":
        return "timeGridDay";
      case "weekly":
        return "timeGridWeek";
      case "monthly":
        return "dayGridMonth";
      default:
        return "timeGridDay";
    }
  };

  const viewType = getViewType();

  return (
    <div 
      className={`${viewMode}-schedule`}
      style={{
        background: "var(--surface)",
        borderRadius: "0.75rem",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        padding: isMobile ? "0.25rem" : "0.5rem",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100%"
      }}
    >
      <div style={{ 
        width: "100%", 
        maxWidth: "100%", 
        overflow: "hidden",
        minWidth: 0 // Prevents flex items from overflowing
      }}>
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
          eventContent={EventContent}
          height={calendarHeight}
          eventMinHeight={isMobile ? 40 : 60}
          dayMaxEvents={isMobile ? 1 : (viewMode === "monthly" ? 2 : 3)}
          headerToolbar={{
            left: "",
            center: "",
            right: "",
          }}
          dayHeaderFormat={{ 
            weekday: isMobile ? "short" : (viewMode === "monthly" ? "short" : "long"), 
            day: "numeric" 
          }}
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
          showNonCurrentDates={viewMode === "monthly" && !isMobile}
          fixedWeekCount={viewMode === "monthly" && !isMobile}
          dayMaxEventRows={isMobile ? 1 : (viewMode === "monthly" ? false : 3)}
          eventDisplay={isMobile ? "list-item" : "block"}
          eventOverlap={false}
          eventConstraint={{
            startTime: "00:00:00",
            endTime: "24:00:00",
            dows: [0, 1, 2, 3, 4, 5, 6],
          }}
          // Mobile-specific settings
          aspectRatio={isMobile ? 1.2 : (viewMode === "monthly" ? 1.35 : 1.1)}
          expandRows={!isMobile}
          handleWindowResize={true}
          // Responsive settings
          windowResizeDelay={100}
          // Event rendering optimizations
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }}
          // List view specific settings for mobile
          listDayFormat={isMobile ? { month: 'long', day: 'numeric', weekday: 'long' } : undefined}
          listDaySideFormat={isMobile ? { month: 'long', day: 'numeric', year: 'numeric' } : undefined}
          // Custom day header rendering
          dayHeaderDidMount={(arg) => {
            const headerEl = arg.el;
            const dayNumber = arg.date.getDate();
            const dayName = arg.date.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Clear existing content
            headerEl.innerHTML = '';
            
            // Create day number element
            const dayNumberEl = document.createElement('div');
            dayNumberEl.textContent = dayNumber.toString();
            dayNumberEl.style.cssText = `
              font-size: 1.25rem;
              font-weight: 700;
              color: var(--primary-dark);
              margin-bottom: 0.25rem;
              line-height: 1.2;
            `;
            
            // Create day name element
            const dayNameEl = document.createElement('div');
            dayNameEl.textContent = dayName;
            dayNameEl.style.cssText = `
              font-size: 0.875rem;
              font-weight: 500;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.2;
            `;
            
            // Add elements to header
            headerEl.appendChild(dayNumberEl);
            headerEl.appendChild(dayNameEl);
            
            // Add today styling
            if (arg.isToday) {
              headerEl.style.backgroundColor = 'var(--primary-medium)';
              headerEl.style.color = 'var(--white)';
              dayNumberEl.style.color = 'var(--white)';
              dayNameEl.style.color = 'var(--white)';
              dayNameEl.style.opacity = '0.9';
            }
            
            // Add weekend styling
            if (arg.date.getDay() === 0 || arg.date.getDay() === 6) {
              headerEl.style.backgroundColor = 'var(--background-light)';
              dayNumberEl.style.color = 'var(--text-muted)';
              dayNameEl.style.color = 'var(--text-muted)';
            }
          }}
          // Mobile-friendly event display
          eventDidMount={(info) => {
            const eventEl = info.el;
            if (isMobile) {
              eventEl.style.fontSize = "0.875rem";
              eventEl.style.padding = "0.5rem";
              eventEl.style.margin = "0.25rem 0";
              eventEl.style.borderRadius = "0.5rem";
              eventEl.style.cursor = "pointer";
              eventEl.style.border = "1px solid var(--border)";
              eventEl.style.backgroundColor = "var(--surface)";
              eventEl.style.width = "100%";
              eventEl.style.maxWidth = "100%";
              eventEl.style.overflow = "hidden";
            } else {
              eventEl.style.fontSize = "0.75rem";
              eventEl.style.padding = "2px 4px";
              eventEl.style.margin = "1px";
              eventEl.style.borderRadius = "4px";
              eventEl.style.cursor = "pointer";
              eventEl.style.width = "100%";
              eventEl.style.maxWidth = "100%";
              eventEl.style.overflow = "hidden";
            }
          }}
        />
      </div>
    </div>
  );
};
