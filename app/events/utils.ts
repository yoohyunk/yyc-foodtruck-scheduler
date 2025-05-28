export const extractTime = (dateTime: string): string => {
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
