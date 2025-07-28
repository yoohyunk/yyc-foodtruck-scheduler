import { NextRequest, NextResponse } from "next/server";
import { cleanPostalCode, cleanFullAddress } from "@/lib/utils";

// Configuration
const TIMEOUT_MS = 5000; // 5 second timeout (reduced from 10)
const RATE_LIMIT_DELAY = 500; // 0.5 second between requests (reduced from 1)

// Rate limiting
let lastRequestTime = 0;

// Simple in-memory cache for autocomplete results
interface CacheEntry {
  data: {
    success: boolean;
    suggestions: Array<{
      display: string;
      streetNumber: string;
      streetName: string;
      city: string;
      postalCode: string;
      coordinates: { latitude: number; longitude: number };
      fullAddress: string;
    }>;
  };
  timestamp: number;
}
const autocompleteCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCacheKey(text: string, limit: string): string {
  return `${text.toLowerCase().trim()}_${limit}`;
}

interface GeoapifySuggestion {
  properties: {
    name: string;
    street: string;
    housenumber: string;
    city: string;
    postcode: string;
    country: string;
    formatted: string;
  };
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface GeoapifyResponse {
  features: GeoapifySuggestion[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");
    const limit = searchParams.get("limit") || "5";

    if (!text || text.trim().length < 3) {
      return NextResponse.json(
        {
          error: "Text parameter is required and must be at least 3 characters",
        },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(text, limit);
    const cachedResult = autocompleteCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedResult.data);
    }

    // Get API key from environment
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Geoapify API key not configured" },
        { status: 500 }
      );
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Build the API URL - filter for Alberta addresses only
    // Add Alberta to the search text to prioritize Alberta results
    const apiUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text + " Alberta")}&filter=countrycode:ca&limit=${limit}&apiKey=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(apiUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeoapifyResponse = await response.json();

    // Transform the response to match our expected format
    // Filter for Alberta addresses only
    const suggestions = data.features
      .filter((feature) => {
        const props = feature.properties;
        // Check if the address contains Alberta or AB
        const addressText = props.formatted.toLowerCase();
        const city = props.city?.toLowerCase() || "";

        // Alberta cities list
        const albertaCities = [
          "calgary",
          "edmonton",
          "airdrie",
          "banff",
          "canmore",
          "cochrane",
          "fort mcmurray",
          "grande prairie",
          "leduc",
          "lethbridge",
          "medicine hat",
          "okotoks",
          "red deer",
          "spruce grove",
          "st. albert",
        ];

        return (
          addressText.includes("alberta") ||
          addressText.includes(", ab") ||
          addressText.includes(" ab ") ||
          albertaCities.some((cityName) => city.includes(cityName))
        );
      })
      .map((feature) => {
        const props = feature.properties;
        const [longitude, latitude] = feature.geometry.coordinates;

        // Clean postal code and full address using utility functions
        const cleanPostalCodeValue = cleanPostalCode(props.postcode || "");
        const cleanFullAddressValue = cleanFullAddress(props.formatted);

        return {
          display: props.formatted,
          streetNumber: props.housenumber || "",
          streetName: props.street || "",
          city: props.city || "",
          postalCode: cleanPostalCodeValue,
          coordinates: {
            latitude,
            longitude,
          },
          fullAddress: cleanFullAddressValue,
        };
      });

    const result = {
      success: true,
      suggestions,
    };

    // Cache the result
    autocompleteCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in autocomplete route:", error);

    let errorMessage = "Error fetching address suggestions. Please try again.";

    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        errorMessage =
          "Request timed out. Please check your internet connection and try again.";
      } else if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
