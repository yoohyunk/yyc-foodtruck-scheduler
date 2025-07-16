interface Coordinates {
  lat: number;
  lng: number;
}

// more efficient caching system
const coordinatesCache = new Map<string, Coordinates>();

// Format address for Nominatim API
function formatAddress(address: string): string {
  // Clean up double spaces and normalize spacing first
  const cleanAddress = address.replace(/\s+/g, " ").trim();

  // Check if address already has a city and province
  const hasCityProvince = /,\s*[A-Za-z\s]+,\s*AB/i.test(cleanAddress);

  if (hasCityProvince) {
    // Address already has city and Alberta province, just ensure it ends with "Canada"
    if (!cleanAddress.toLowerCase().includes("canada")) {
      return `${cleanAddress}, Canada`;
    }
    return cleanAddress;
  }

  // Check if address already has a city (from AddressForm format like "4908 23 Avenue NW, Calgary,")
  const hasCity = /,\s*[A-Za-z\s]+,?\s*$/i.test(cleanAddress);
  if (hasCity) {
    // Address already has a city, add Alberta and Canada if missing
    if (
      !cleanAddress.toLowerCase().includes("alberta") &&
      !cleanAddress.toLowerCase().includes("ab")
    ) {
      return `${cleanAddress} Alberta, Canada`;
    }
    if (!cleanAddress.toLowerCase().includes("canada")) {
      return `${cleanAddress}, Canada`;
    }
    return cleanAddress;
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

  const addressLower = cleanAddress.toLowerCase();
  const foundCity = albertaCities.find((city) => addressLower.includes(city));

  if (foundCity) {
    // Address contains a known Alberta city, add Alberta and Canada if missing
    if (!addressLower.includes("alberta") && !addressLower.includes("ab")) {
      return `${cleanAddress}, Alberta, Canada`;
    }

    // If Alberta is already present, just add Canada if missing
    if (!addressLower.includes("canada")) {
      return `${cleanAddress}, Canada`;
    }
    return cleanAddress;
  }

  // If no Alberta city is detected, assume it's a street address and add Calgary as default
  // (keeping backward compatibility for existing Calgary-based addresses)
  if (!cleanAddress.toLowerCase().includes("calgary")) {
    return `${cleanAddress}, Calgary, Alberta, Canada`;
  }

  return cleanAddress;
}

export async function getCoordinates(address: string): Promise<Coordinates> {
  // Format address for Nominatim first
  const formattedAddress = formatAddress(address);

  // Check cache using formatted address as key
  if (coordinatesCache.has(formattedAddress)) {
    return coordinatesCache.get(formattedAddress)!;
  }

  try {
    // Make request to our geocoding API
    let response = await fetch(
      `/api/geocode?address=${encodeURIComponent(formattedAddress)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();

    if (data.success && data.coordinates) {
      const coords = {
        lat: data.coordinates.latitude,
        lng: data.coordinates.longitude,
      };

      coordinatesCache.set(formattedAddress, coords);
      return coords;
    }

    // Try again without postal code if not found
    const addressNoPostal = address
      .replace(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d,?/, "")
      .replace(/\s+,/, ",")
      .replace(/,,/, ",")
      .trim();

    if (addressNoPostal !== address) {
      const formattedAddressNoPostal = formatAddress(addressNoPostal);

      response = await fetch(
        `/api/geocode?address=${encodeURIComponent(formattedAddressNoPostal)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        data = await response.json();
        if (data.success && data.coordinates) {
          const coords = {
            lat: data.coordinates.latitude,
            lng: data.coordinates.longitude,
          };
          coordinatesCache.set(formattedAddress, coords);
          return coords;
        }
      }
    }

    // If all else fails, use appropriate fallback coordinates based on address
    const fallbackCoords = getFallbackCoordinates(formattedAddress);

    coordinatesCache.set(formattedAddress, fallbackCoords);
    return fallbackCoords;
  } catch (error) {
    console.error("Error getting coordinates:", error);
    // Return appropriate fallback coordinates
    const fallbackCoords = getFallbackCoordinates(address);

    return fallbackCoords;
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
  // Import the utility function for straight-line distance calculation
  const { calculateStraightLineDistance } = await import(
    "@/lib/utils/distance"
  );
  return calculateStraightLineDistance(coord1, coord2);
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
    isAvailable?: boolean;
  }>,
  eventCoordinates?: { latitude: number; longitude: number }
): Promise<EmployeeWithDistance[]> {
  try {
    // Get event coordinates
    const eventCoords = eventCoordinates
      ? { lat: eventCoordinates.latitude, lng: eventCoordinates.longitude }
      : await getCoordinates(eventAddress);

    // Filter to only available employees first
    const availableEmployees = employees.filter(
      (emp) => emp.isAvailable !== false
    );

    // Import utility functions
    const { calculateStraightLineDistance } = await import(
      "@/lib/utils/distance"
    );

    // Process all available employees at once using their stored coordinates
    const results = await Promise.all(
      availableEmployees.map(async (employee) => {
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

        // Calculate distance using straight-line distance
        let distance = Infinity;
        try {
          distance = calculateStraightLineDistance(employeeCoords, eventCoords);
        } catch (error) {
          console.warn(
            `Failed to calculate distance for ${employee.name}:`,
            error
          );
          distance = Infinity;
        }

        return {
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          wage: employee.wage,
          distance,
        };
      })
    );

    // Sort by distance first, then by wage if within 5km, with employees without addresses last
    return results.sort((a, b) => {
      // First priority: employees without addresses go last
      if (a.distance === Infinity && b.distance !== Infinity) {
        return 1; // a goes after b
      }
      if (a.distance !== Infinity && b.distance === Infinity) {
        return -1; // a goes before b
      }
      if (a.distance === Infinity && b.distance === Infinity) {
        // Both have no addresses, sort by wage (lower first)
        return a.wage - b.wage;
      }

      // Both have addresses, check if within 5km of each other
      if (Math.abs(a.distance - b.distance) <= 5) {
        // If within 5km, sort by wage (lower first)
        return a.wage - b.wage;
      }
      // Otherwise sort by distance (closest first)
      return a.distance - b.distance;
    });
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
