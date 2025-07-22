import { Assignment, CheckinData } from "@/app/types";

// Common utility function to parse time from ISO string (same as events)
export function parseTime(dateStr: string | undefined): {
  hours: number;
  minutes: number;
} {
  if (!dateStr) return { hours: 0, minutes: 0 };
  // Use the same logic as events - extract time from ISO string without timezone conversion
  const timeMatch = dateStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    return { hours: parseInt(timeMatch[1]), minutes: parseInt(timeMatch[2]) };
  }
  return { hours: 0, minutes: 0 };
}

// Calculate time difference in local time (same as events logic)
export function calculateTimeDifference(startTime: string, endTime: string) {
  // Parse times as local time (no timezone conversion)
  const parseTimeForCalculation = (dateStr: string) => {
    const timeMatch = dateStr.match(/T(\d{2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      // Ignore seconds to match events logic

      // Create a date object for today with the parsed time
      const today = new Date();
      today.setHours(hours, minutes, 0, 0); // Set seconds to 0
      return today;
    }
    return new Date(dateStr);
  };

  const start = parseTimeForCalculation(startTime);
  const end = parseTimeForCalculation(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

// Get assignment status based on current time and checkin data
export function getAssignmentStatus(
  assignment: Assignment,
  checkinData: CheckinData
) {
  const now = new Date();
  const start = parseTime(assignment.start_date || assignment.start_time);
  const end = parseTime(assignment.end_date || assignment.end_time);

  // Use today's date for all comparisons
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(start.hours, start.minutes, 0, 0);
  const endDate = new Date(today);
  endDate.setHours(end.hours, end.minutes, 0, 0);

  const checkinStart = new Date(startDate.getTime() - 4 * 60 * 60 * 1000);
  const checkinEnd = new Date(startDate.getTime() + 1 * 60 * 60 * 1000);
  const overtimeEnd = new Date(endDate.getTime() + 4 * 60 * 60 * 1000);

  if (checkinData?.clock_out_at) return "checked_out";
  if (checkinData?.clock_in_at && !checkinData?.clock_out_at) {
    if (now > endDate && now <= overtimeEnd) return "overtime";
    if (now > overtimeEnd) return "overtime_expired";
    if (now > endDate) return "overtime";
    return "checked_in";
  }
  if (now < checkinStart) return "before";
  if (now >= checkinStart && now <= checkinEnd) return "ready";
  if (now > checkinEnd) return "missed";
  return "ready";
}
