import { NextRequest, NextResponse } from "next/server";

// Configuration
const MAX_RETRIES = 3; // Increased to 3 retries
const BASE_DELAY = 1000; // Increased to 1 second
const TIMEOUT_MS = 15000; // Increased to 15 seconds
const RATE_LIMIT_DELAY = 1500; // 1.5 seconds between requests

// Local geocoding cache for common addresses
const geocodingCache = new Map<
  string,
  { latitude: number; longitude: number; display_name: string }
>();

// Rate limiting
let lastRequestTime = 0;

// Common Alberta addresses cache
const COMMON_ADDRESSES: {
  [key: string]: { latitude: number; longitude: number; display_name: string };
} = {
  // Calgary addresses
  calgary: {
    latitude: 51.0452,
    longitude: -114.0697,
    display_name: "Calgary, Alberta, Canada",
  },
  "downtown calgary": {
    latitude: 51.0452,
    longitude: -114.0697,
    display_name: "Downtown Calgary, Alberta, Canada",
  },
  "calgary downtown": {
    latitude: 51.0452,
    longitude: -114.0697,
    display_name: "Calgary Downtown, Alberta, Canada",
  },

  // Edmonton addresses
  edmonton: {
    latitude: 53.5461,
    longitude: -113.4938,
    display_name: "Edmonton, Alberta, Canada",
  },
  "downtown edmonton": {
    latitude: 53.5461,
    longitude: -113.4938,
    display_name: "Downtown Edmonton, Alberta, Canada",
  },

  // Other major cities
  airdrie: {
    latitude: 51.2915,
    longitude: -114.0147,
    display_name: "Airdrie, Alberta, Canada",
  },
  banff: {
    latitude: 51.1784,
    longitude: -115.5708,
    display_name: "Banff, Alberta, Canada",
  },
  canmore: {
    latitude: 51.0891,
    longitude: -115.3583,
    display_name: "Canmore, Alberta, Canada",
  },
  cochrane: {
    latitude: 51.1894,
    longitude: -114.468,
    display_name: "Cochrane, Alberta, Canada",
  },
  "fort mcmurray": {
    latitude: 56.7264,
    longitude: -111.3808,
    display_name: "Fort McMurray, Alberta, Canada",
  },
  "grande prairie": {
    latitude: 55.1699,
    longitude: -118.7979,
    display_name: "Grande Prairie, Alberta, Canada",
  },
  leduc: {
    latitude: 53.2594,
    longitude: -113.5492,
    display_name: "Leduc, Alberta, Canada",
  },
  lethbridge: {
    latitude: 49.6942,
    longitude: -112.8328,
    display_name: "Lethbridge, Alberta, Canada",
  },
  "medicine hat": {
    latitude: 50.0421,
    longitude: -110.7192,
    display_name: "Medicine Hat, Alberta, Canada",
  },
  okotoks: {
    latitude: 50.7256,
    longitude: -113.9747,
    display_name: "Okotoks, Alberta, Canada",
  },
  "red deer": {
    latitude: 52.2691,
    longitude: -113.8117,
    display_name: "Red Deer, Alberta, Canada",
  },
  "spruce grove": {
    latitude: 53.5454,
    longitude: -113.9187,
    display_name: "Spruce Grove, Alberta, Canada",
  },
  "st. albert": {
    latitude: 53.6305,
    longitude: -113.6256,
    display_name: "St. Albert, Alberta, Canada",
  },
};

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Clean address formatting - fix double spaces and normalize
function cleanAddress(address: string): string {
  return address
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\s*,\s*/g, ", ") // Normalize comma spacing
    .trim();
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Rate limiting between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
      }
      lastRequestTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      const delayMs = BASE_DELAY * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw new Error(`Failed after ${retries + 1} attempts`);
}

// Fallback coordinates for major Alberta cities
const FALLBACK_COORDINATES: {
  [key: string]: { latitude: number; longitude: number };
} = {
  calgary: { latitude: 51.0452, longitude: -114.0697 },
  airdrie: { latitude: 51.2915, longitude: -114.0147 },
  banff: { latitude: 51.1784, longitude: -115.5708 },
  canmore: { latitude: 51.0891, longitude: -115.3583 },
  cochrane: { latitude: 51.1894, longitude: -114.468 },
  edmonton: { latitude: 53.5461, longitude: -113.4938 },
  "fort mcmurray": { latitude: 56.7264, longitude: -111.3808 },
  "grande prairie": { latitude: 55.1699, longitude: -118.7979 },
  leduc: { latitude: 53.2594, longitude: -113.5492 },
  lethbridge: { latitude: 49.6942, longitude: -112.8328 },
  "medicine hat": { latitude: 50.0421, longitude: -110.7192 },
  okotoks: { latitude: 50.7256, longitude: -113.9747 },
  "red deer": { latitude: 52.2691, longitude: -113.8117 },
  "spruce grove": { latitude: 53.5454, longitude: -113.9187 },
  "st. albert": { latitude: 53.6305, longitude: -113.6256 },
};

function getFallbackCoordinates(address: string): {
  latitude: number;
  longitude: number;
} {
  const addressLower = address.toLowerCase();

  // Check if address contains any known Alberta city
  for (const [city, coords] of Object.entries(FALLBACK_COORDINATES)) {
    if (addressLower.includes(city)) {
      return coords;
    }
  }

  // Default to Calgary if no specific city is found
  return FALLBACK_COORDINATES.calgary;
}

export async function GET(request: NextRequest) {
  let address: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    // Clean the address first
    const cleanedAddress = cleanAddress(address);

    // Check local cache first
    if (geocodingCache.has(cleanedAddress)) {
      const cached = geocodingCache.get(cleanedAddress)!;
      return NextResponse.json({
        success: true,
        coordinates: { latitude: cached.latitude, longitude: cached.longitude },
        address: cleanedAddress,
        display_name: cached.display_name,
        cached: true,
      });
    }

    // Check common addresses cache (only for city names, not specific addresses)
    const addressLower = cleanedAddress.toLowerCase();
    for (const [commonAddr, coords] of Object.entries(COMMON_ADDRESSES)) {
      // Only match if it's exactly the city name (not a specific address containing the city)
      if (addressLower === commonAddr) {
        // Cache this result
        geocodingCache.set(cleanedAddress, coords);
        return NextResponse.json({
          success: true,
          coordinates: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
          address: cleanedAddress,
          display_name: coords.display_name,
          cached: true,
          fallback: true, // Mark as fallback since it's just a city center
        });
      }
    }

    // Try with Alberta restrictions first
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedAddress)}&countrycodes=ca&limit=1&addressdetails=1&bounded=1&viewbox=-120.0,49.0,-110.0,60.0&bounded=1`;

    try {
      let response = await fetchWithRetry(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "YYCFoodTrucks/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();

      // If no results with restrictions, try without them
      if (!data || data.length === 0) {
        url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedAddress)}&limit=1&addressdetails=1`;

        response = await fetchWithRetry(url, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "YYCFoodTrucks/1.0",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
      }

      if (data && data.length > 0) {
        const coords = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };

        // console.log("Nominatim API found address:", {
        //   address: cleanedAddress,
        //   coords,
        //   display_name: data[0].display_name,
        //   results_count: data.length
        // });

        // Cache the successful result
        geocodingCache.set(cleanedAddress, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          display_name: data[0].display_name,
        });

        return NextResponse.json({
          success: true,
          coordinates: coords,
          address: cleanedAddress,
          display_name: data[0].display_name,
        });
      } else {
        // console.log("Nominatim API returned no results for:", cleanedAddress);
      }
    } catch (error) {
      console.error("Nominatim API failed:", error);
    }

    // Use fallback coordinates based on the address
    const fallbackCoords = getFallbackCoordinates(cleanedAddress);

    // console.log("Using fallback coordinates:", {
    //   address: cleanedAddress,
    //   fallbackCoords,
    //   reason: "Nominatim API failed or returned no results"
    // });

    return NextResponse.json({
      success: true,
      coordinates: fallbackCoords,
      address: cleanedAddress,
      display_name: cleanedAddress,
      fallback: true, // Indicate this is a fallback result
      fallbackType: "city_center", // Indicate we're using city center coordinates
    });
  } catch (error) {
    console.error("Error in geocoding route:", error);

    // Even if everything fails, return fallback coordinates
    const fallbackCoords = getFallbackCoordinates(address || "Calgary");

    return NextResponse.json({
      success: true,
      coordinates: fallbackCoords,
      address: address || "Calgary",
      display_name: address || "Calgary",
      fallback: true,
    });
  }
}
