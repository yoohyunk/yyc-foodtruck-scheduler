"use client";
import React, { useState, useRef, useEffect } from "react";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isMobile?: boolean;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onDateChange,
  isMobile = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDate = new Date(startDate);

    // Generate 6 weeks of days (42 days total)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isSelected =
        currentDate.getDate() === selectedDate.getDate() &&
        currentDate.getMonth() === selectedDate.getMonth() &&
        currentDate.getFullYear() === selectedDate.getFullYear();
      const isToday =
        currentDate.getDate() === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isSelected,
        isToday,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setIsOpen(false);
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatMonthYear = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          color: "var(--text-primary)",
          fontSize: isMobile ? "0.875rem" : "1rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: isMobile ? "140px" : "160px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--surface-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--surface)";
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>📅</span>
        <span>{formatDate(selectedDate)}</span>
        <span style={{ fontSize: "0.8rem", marginLeft: "auto" }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            padding: "1rem",
            marginTop: "0.25rem",
            minWidth: isMobile ? "280px" : "320px",
          }}
        >
          {/* Month Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={handlePreviousMonth}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0.25rem",
                borderRadius: "0.25rem",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontWeight: "600",
                fontSize: isMobile ? "1rem" : "1.1rem",
                color: "var(--text-primary)",
              }}
            >
              {formatMonthYear(currentMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0.25rem",
                borderRadius: "0.25rem",
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              ›
            </button>
          </div>

          {/* Day Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.25rem",
              marginBottom: "0.5rem",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "var(--text-muted)",
                  padding: "0.25rem",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.25rem",
            }}
          >
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateSelect(day.date)}
                style={{
                  background: day.isSelected
                    ? "var(--primary-medium)"
                    : day.isToday
                      ? "var(--primary-light)"
                      : "transparent",
                  border: "none",
                  borderRadius: "0.25rem",
                  padding: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  color: day.isSelected
                    ? "white"
                    : day.isCurrentMonth
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  fontWeight: day.isSelected || day.isToday ? "600" : "400",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!day.isSelected) {
                    e.currentTarget.style.background = day.isCurrentMonth
                      ? "var(--surface-hover)"
                      : "var(--surface-light)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!day.isSelected) {
                    e.currentTarget.style.background = day.isToday
                      ? "var(--primary-light)"
                      : "transparent";
                  }
                }}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => {
                const today = new Date();
                onDateChange(today);
                setCurrentMonth(today);
                setIsOpen(false);
              }}
              style={{
                background: "var(--primary-light)",
                border: "1px solid var(--primary-medium)",
                borderRadius: "0.25rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                cursor: "pointer",
                color: "var(--primary-dark)",
                fontWeight: "500",
              }}
            >
              Today
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "0.25rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
