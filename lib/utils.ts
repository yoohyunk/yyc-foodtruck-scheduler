import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cleans a postal code by removing Canadian province prefixes
 * @param postalCode - The postal code to clean (e.g., "AB T3G 4Y9")
 * @returns The cleaned postal code (e.g., "T3G 4Y9")
 */
export function cleanPostalCode(postalCode: string): string {
  if (!postalCode) return "";

  // Remove province prefix if present (e.g., "AB T3G 4Y9" -> "T3G 4Y9")
  // Also remove any province code that might be in the middle or end
  let cleaned = postalCode.replace(
    /^(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s*/,
    ""
  );
  cleaned = cleaned.replace(/\s+(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)$/, "");
  cleaned = cleaned.replace(
    /\s+(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s+/,
    " "
  );

  return cleaned;
}

/**
 * Cleans a full address by removing province codes
 * @param fullAddress - The full address to clean (e.g., "112 Avenue NW, Calgary, AB T3G 4Y9, Canada")
 * @returns The cleaned full address (e.g., "112 Avenue NW, Calgary, T3G 4Y9, Canada")
 */
export function cleanFullAddress(fullAddress: string): string {
  if (!fullAddress) return "";

  // Remove province code from the address (e.g., "112 Avenue NW, Calgary, AB T3G 4Y9, Canada" -> "112 Avenue NW, Calgary, T3G 4Y9, Canada")
  return fullAddress.replace(
    /, (AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\s+/,
    ", "
  );
}

/**
 * Gets the base URL for the application from environment variables
 * @returns The base URL for redirects and links
 */
export function getBaseUrl(): string {
  // Check for explicit base URL override first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // For server-side (API routes), check if we're in development
  if (typeof window === "undefined") {
    if (process.env.NODE_ENV === "development") {
      return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    }
    // For production server-side, use NEXT_PUBLIC_SITE_URL or fallback
    return (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://yyc-foodtruck-scheduler.vercel.app"
    );
  }

  // For client-side, we can use window.location.origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Final fallback
  return "https://yyc-foodtruck-scheduler.vercel.app";
}
