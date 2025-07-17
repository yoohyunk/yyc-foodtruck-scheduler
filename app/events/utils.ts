export const extractTime = (dateTime: string): string => {
  // Parse the ISO string and extract just the time part
  // This treats the stored time as local time without timezone conversion
  const timeMatch = dateTime.match(/T(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // Fallback to the original method if the format is unexpected
  const date = new Date(dateTime);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
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
