import { NextRequest, NextResponse } from "next/server";

// Configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const TIMEOUT_MS = 15000;
const RATE_LIMIT_DELAY = 1500;

// Rate limiting
let lastRequestTime = 0;

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        headers: {
          "User-Agent": "YYCFoodTrucks/1.0",
          ...options.headers,
        },
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coord1 = searchParams.get("coord1");
    const coord2 = searchParams.get("coord2");

    if (!coord1 || !coord2) {
      return NextResponse.json(
        { error: "coord1 and coord2 parameters are required" },
        { status: 400 }
      );
    }

    // Validate coordinate format
    const coordRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (!coordRegex.test(coord1) || !coordRegex.test(coord2)) {
      return NextResponse.json(
        { error: "Invalid coordinate format. Use 'lat,lng' format" },
        { status: 400 }
      );
    }

    // Parse coordinates once
    const [lat1, lng1] = coord1.split(",").map(Number);
    const [lat2, lng2] = coord2.split(",").map(Number);

    // Format as longitude,latitude for OSRM
    const osrmCoord1 = `${lng1},${lat1}`;
    const osrmCoord2 = `${lng2},${lat2}`;

    const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoord1};${osrmCoord2}?overview=false&alternatives=false`;

    console.log(
      `[DISTANCE API] Requesting route from ${osrmCoord1} to ${osrmCoord2}`
    );

    try {
      const response = await fetchWithRetry(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OSRM API error: ${response.status} - ${errorText}`);
        throw new Error(`OSRM HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        // Convert meters to kilometers
        const distance = data.routes[0].distance / 1000;
        return NextResponse.json({
          success: true,
          distance,
          duration: data.routes[0].duration,
        });
      }
    } catch (osrmError) {
      console.warn(
        "OSRM API failed, using fallback distance calculation:",
        osrmError
      );
    }

    // Fallback: Calculate straight-line distance when OSRM fails or times out
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;

    return NextResponse.json({
      success: true,
      distance: straightLineDistance,
      fallback: true,
      message: "OSRM unavailable, using straight-line distance",
    });
  } catch (error) {
    console.error("Error calculating distance:", error);

    // Final fallback: return error with coordinates for manual calculation
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate distance",
        fallback: true,
      },
      { status: 500 }
    );
  }
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
