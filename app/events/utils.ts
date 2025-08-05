export const extractTime = (dateTime: string): string => {
  // Parse the ISO string and extract just the time part
  // This treats the stored time as local time without timezone conversion
  const timeMatch = dateTime.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);

    // Convert to 12-hour format with AM/PM
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // Fallback to the original method if the format is unexpected
  const date = new Date(dateTime);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour format with AM/PM
  });
};

export const extractDate = (
  startDateTime: string,
  endDateTime: string
): string => {
  const startDate = new Date(startDateTime);
  const endDate = new Date(endDateTime);
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString();
  }
  return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
};
