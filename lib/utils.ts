import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get local timezone offset in ISO format (e.g., "-06:00" for MDT)
 * This ensures times are stored exactly as the user entered them
 */
export function getLocalTimezoneOffset(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const hours = Math.abs(Math.floor(offset / 60));
  const minutes = Math.abs(offset % 60);
  const sign = offset <= 0 ? '+' : '-';
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Create a timezone-aware datetime string from date and time components
 * This preserves the exact time the user entered without timezone conversion
 */
export function createLocalDateTime(date: string, time: string): string {
  const timezoneOffset = getLocalTimezoneOffset();
  const result = `${date}T${time}${timezoneOffset}`;
  console.log('createLocalDateTime:', { date, time, timezoneOffset, result });
  return result;
}
