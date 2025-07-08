interface Coordinates {
  lat: number;
  lng: number;
}

interface OSRMResponse {
  code: string;
  routes: Array<{
    distance: number; // distance in meters
    duration: number;
    geometry: string;
  }>;
}

// more efficient caching system
const coordinatesCache = new Map<string, Coordinates>();

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format address for Nominatim API
function formatAddress(address: string): string {
  // Check if address already has a city and province
  const hasCityProvince = /,\s*[A-Za-z\s]+,\s*AB/i.test(address);

  if (hasCityProvince) {
    // Address already has city and Alberta province, just ensure it ends with "Canada"
    if (!address.toLowerCase().includes("canada")) {
      return `${address}, Canada`;
    }
    return address;
  }

  // Check if address contains an Alberta city name (matching AddressForm dropdown)
  const albertaCities = [
    "calgary",
    "airdrie",
    "banff",
    "canmore",
    "cochrane",
    "edmonton",
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

  const addressLower = address.toLowerCase();
  const foundCity = albertaCities.find((city) => addressLower.includes(city));

  if (foundCity) {
    // Address contains a known Alberta city, add Alberta and Canada if missing
    if (!addressLower.includes("alberta") && !addressLower.includes("ab")) {
      return `${address}, Alberta, Canada`;
    }

    // If Alberta is already present, just add Canada if missing
    if (!addressLower.includes("canada")) {
      return `${address}, Canada`;
    }
    return address;
  }

  // If no Alberta city is detected, assume it's a street address and add Calgary as default
  // (keeping backward compatibility for existing Calgary-based addresses)
  if (!address.toLowerCase().includes("calgary")) {
    return `${address}, Calgary, Alberta, Canada`;
  }

  return address;
}

export async function getCoordinates(address: string): Promise<Coordinates> {
  // Check cache first
  if (coordinatesCache.has(address)) {
    return coordinatesCache.get(address)!;
  }

  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Format address for Nominatim
    const formattedAddress = formatAddress(address);
    // Make request to Nominatim API for geocoding
    let response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(formattedAddress)}&` +
        `countrycodes=ca&` + // Limit to Canada
        `limit=1&` + // Get only the first result
        `addressdetails=1&` + // Include address details
        `bounded=1&` + // Restrict results to the bounding box
        `viewbox=-120.0,49.0,-110.0,60.0&` + // Alberta bounding box
        `bounded=1`, // Enable bounded search
      {
        headers: {
          "User-Agent": "YYCFoodTrucks/1.0", // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    if (data && data[0]) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
      coordinatesCache.set(address, coords);
      return coords;
    }

    // Try again without postal code if not found
    const addressNoPostal = address
      .replace(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d,?/, "")
      .replace(/\s+,/, ",")
      .replace(/,,/, ",")
      .trim();
    if (addressNoPostal !== address) {
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(addressNoPostal)}&` +
          `countrycodes=ca&` +
          `limit=1&` +
          `addressdetails=1&` +
          `bounded=1&` +
          `viewbox=-120.0,49.0,-110.0,60.0&` + // Alberta bounding box
          `bounded=1`,
        {
          headers: {
            "User-Agent": "YYCFoodTrucks/1.0",
          },
        }
      );
      if (response.ok) {
        data = await response.json();
        if (data && data[0]) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          coordinatesCache.set(address, coords);
          return coords;
        }
      }
    }

    // If all else fails, use appropriate fallback coordinates based on address
    const fallbackCoords = getFallbackCoordinates(formattedAddress);
    console.warn(
      `No coordinates found for ${formattedAddress}, using fallback coordinates: ${fallbackCoords.lat}, ${fallbackCoords.lng}`
    );
    coordinatesCache.set(address, fallbackCoords);
    return fallbackCoords;
  } catch (error) {
    console.error("Error getting coordinates:", error);
    // Return appropriate fallback coordinates
    return getFallbackCoordinates(address);
  }
}

// Get fallback coordinates based on address content
function getFallbackCoordinates(address: string): Coordinates {
  const addressLower = address.toLowerCase();

  // Major Alberta cities with their downtown coordinates (matching AddressForm dropdown)
  const albertaCityCoordinates: { [key: string]: Coordinates } = {
    calgary: { lat: 51.0452, lng: -114.0697 },
    airdrie: { lat: 51.2915, lng: -114.0147 },
    banff: { lat: 51.1784, lng: -115.5708 },
    canmore: { lat: 51.0891, lng: -115.3583 },
    cochrane: { lat: 51.1894, lng: -114.468 },
    edmonton: { lat: 53.5461, lng: -113.4938 },
    "fort mcmurray": { lat: 56.7264, lng: -111.3808 },
    "grande prairie": { lat: 55.1699, lng: -118.7979 },
    leduc: { lat: 53.2594, lng: -113.5492 },
    lethbridge: { lat: 49.6942, lng: -112.8328 },
    "medicine hat": { lat: 50.0421, lng: -110.7192 },
    okotoks: { lat: 50.7256, lng: -113.9747 },
    "red deer": { lat: 52.2691, lng: -113.8117 },
    "spruce grove": { lat: 53.5454, lng: -113.9187 },
    "st. albert": { lat: 53.6305, lng: -113.6256 },
  };

  // Check if address contains any known Alberta city
  for (const [city, coords] of Object.entries(albertaCityCoordinates)) {
    if (addressLower.includes(city)) {
      return coords;
    }
  }

  // Default to Calgary if no specific Alberta city is found (maintaining backward compatibility)
  return albertaCityCoordinates["calgary"];
}

export async function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): Promise<number> {
  // If coordinates are exactly the same, return 0
  if (coord1.lat === coord2.lat && coord1.lng === coord2.lng) {
    return 0;
  }

  // If coordinates are very close (within ~10 meters), return a small distance
  const latDiff = Math.abs(coord1.lat - coord2.lat);
  const lngDiff = Math.abs(coord1.lng - coord2.lng);
  if (latDiff < 0.0001 && lngDiff < 0.0001) {
    return 0.01; // Return 10 meters
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
      }
      lastRequestTime = Date.now();

      // Use OSRM public API for driving distance
      // Format coordinates with 6 decimal places for precision
      const url = `https://router.project-osrm.org/route/v1/driving/${coord1.lng.toFixed(6)},${coord1.lat.toFixed(6)};${coord2.lng.toFixed(6)},${coord2.lat.toFixed(6)}?overview=false&alternatives=false`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "YYCFoodTrucks/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`OSRM HTTP error! status: ${response.status}`);
      }

      const data: OSRMResponse = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        // Convert meters to kilometers
        const distance = data.routes[0].distance / 1000;
        return distance;
      }

      // If we get here, the response was ok but no route was found
      throw new Error("OSRM: No route found between the given coordinates.");
    } catch (error) {
      console.error(
        `Error calculating driving distance (attempt ${retryCount + 1}/${maxRetries}):`,
        error
      );
      retryCount++;

      if (retryCount === maxRetries) {
        console.warn(
          "All retries failed, falling back to straight-line distance"
        );
        // Calculate straight-line distance as a fallback
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lng - coord1.lng);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(coord1.lat)) *
            Math.cos(toRad(coord2.lat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightLineDistance = R * c;

        console.warn(
          "Using straight-line distance as fallback:",
          straightLineDistance,
          "km"
        );
        return straightLineDistance;
      }

      // Wait before retrying
      await delay(1000 * retryCount);
    }
  }

  // This should never be reached due to the fallback in the catch block
  throw new Error("Failed to calculate distance after all retries");
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface EmployeeWithDistance {
  id: number;
  employeeId: number;
  name: string;
  wage: number;
  distance: number;
}

export async function findClosestEmployees(
  eventAddress: string,
  employees: Array<{
    id: number;
    name: string;
    wage: number;
    address: string;
    coordinates?: { latitude: number; longitude: number };
  }>,
  eventCoordinates?: { latitude: number; longitude: number }
): Promise<EmployeeWithDistance[]> {
  try {
    // Get event coordinates
    const eventCoords = eventCoordinates
      ? { lat: eventCoordinates.latitude, lng: eventCoordinates.longitude }
      : await getCoordinates(eventAddress);

    // Process all employees at once using their stored coordinates
    const results = await Promise.all(
      employees.map(async (employee) => {
        if (!employee.coordinates) {
          console.warn(
            `No coordinates found for employee ${employee.name}, skipping distance calculation`
          );
          return {
            id: employee.id,
            employeeId: employee.id,
            name: employee.name,
            wage: employee.wage,
            distance: Infinity, // Put employees without coordinates at the end
          };
        }

        const employeeCoords = {
          lat: employee.coordinates.latitude,
          lng: employee.coordinates.longitude,
        };

        // Calculate distance
        const distance = await calculateDistance(eventCoords, employeeCoords);

        return {
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          wage: employee.wage,
          distance,
        };
      })
    );

    // Sort by distance and return
    return results.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error("Error finding closest employees:", error);
    // Return employees in original order if there's an error
    return employees.map((emp) => ({
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      wage: emp.wage,
      distance: 0,
    }));
  }
}
