interface Coordinates {
  lat: number;
  lng: number;
}

interface Employee {
  id: number;
  name: string;
  wage: number;
  address: string;
  coordinates?: { latitude: number; longitude: number };
}

interface OSRMResponse {
  code: string;
  routes: Array<{
    distance: number; // distance in meters
    duration: number;
    geometry: string;
  }>;
}

// Improved approach: Use a more efficient caching system
const coordinatesCache = new Map<string, Coordinates>();
const employeeCoordinatesCache = new Map<number, Coordinates>();

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Format address for Nominatim API
function formatAddress(address: string): string {
  // Remove any existing "Calgary, AB" to avoid duplication
  let formattedAddress = address.replace(/,?\s*Calgary,?\s*AB/i, '').trim();
  
  // Add Calgary, AB if not present
  if (!formattedAddress.toLowerCase().includes('calgary')) {
    formattedAddress = `${formattedAddress}, Calgary, Alberta, Canada`;
  }
  
  // Add postal code if it's a numbered street address
  if (/^\d+\s+\d+/.test(formattedAddress)) {
    // Extract the street number and name
    const match = formattedAddress.match(/^(\d+\s+\d+[a-z]?\s+[a-z]+)/i);
    if (match) {
      const streetPart = match[1];
      // Add T2P postal code for downtown addresses for default fallback
      if (streetPart.toLowerCase().includes('avenue') || 
          streetPart.toLowerCase().includes('street')) {
        formattedAddress = `${streetPart}, Calgary, Alberta T2P, Canada`;
      }
    }
  }
  
  return formattedAddress;
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
      `viewbox=-114.2,51.1,-113.9,51.2&` + // Calgary bounding box
      `bounded=1`, // Enable bounded search
      {
        headers: {
          'User-Agent': 'YYCFoodTrucks/1.0' // Required by Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    if (data && data[0]) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      coordinatesCache.set(address, coords);
      return coords;
    }

    // Try again without postal code if not found
    const addressNoPostal = address.replace(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d,?/, '').replace(/\s+,/, ',').replace(/,,/, ',').trim();
    if (addressNoPostal !== address) {
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(addressNoPostal)}&` +
        `countrycodes=ca&` +
        `limit=1&` +
        `addressdetails=1&` +
        `bounded=1&` +
        `viewbox=-114.2,51.1,-113.9,51.2&` +
        `bounded=1`,
        {
          headers: {
            'User-Agent': 'YYCFoodTrucks/1.0'
          }
        }
      );
      if (response.ok) {
        data = await response.json();
        if (data && data[0]) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          coordinatesCache.set(address, coords);
          return coords;
        }
      }
    }

    // If all else fails, use downtown Calgary as fallback
    console.warn(`No coordinates found for ${formattedAddress}, using downtown Calgary as fallback`);
    const fallbackCoords = { lat: 51.0452, lng: -114.0697 }; // Downtown Calgary
    coordinatesCache.set(address, fallbackCoords);
    return fallbackCoords;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    // Return downtown Calgary coordinates as fallback
    return { lat: 51.0452, lng: -114.0697 };
  }
}

// Cache for distance calculations
const distanceCache = new Map<string, number>();

// Generate a cache key for coordinates
function getCacheKey(coord1: Coordinates, coord2: Coordinates): string {
  return `${coord1.lat},${coord1.lng}-${coord2.lat},${coord2.lng}`;
}

export async function calculateDistance(coord1: Coordinates, coord2: Coordinates): Promise<number> {
  // Check cache first
  const cacheKey = getCacheKey(coord1, coord2);
  const cachedDistance = distanceCache.get(cacheKey);
  if (cachedDistance !== undefined) {
    return cachedDistance;
  }

  // If coordinates are exactly the same, return 0
  if (
    (coord1.lat === coord2.lat && coord1.lng === coord2.lng) ||
    (Number(coord1.lat) === Number(coord2.lat) && Number(coord1.lng) === Number(coord2.lng))
  ) {
    distanceCache.set(cacheKey, 0);
    return 0;
  }

  // If coordinates are very close (within ~10 meters), return a small distance
  const latDiff = Math.abs(coord1.lat - coord2.lat);
  const lngDiff = Math.abs(coord1.lng - coord2.lng);
  if (latDiff < 0.0001 && lngDiff < 0.0001) {
    const smallDistance = 0.01; // 10 meters
    distanceCache.set(cacheKey, smallDistance);
    return smallDistance;
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
      const url = `https://router.project-osrm.org/route/v1/driving/${coord1.lng.toFixed(6)},${coord1.lat.toFixed(6)};${coord2.lng.toFixed(6)},${coord2.lat.toFixed(6)}?overview=false&alternatives=false`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'YYCFoodTrucks/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OSRM HTTP error! status: ${response.status}`);
      }

      const data: OSRMResponse = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // Convert meters to kilometers
        const distance = data.routes[0].distance / 1000;
        // Cache the result
        distanceCache.set(cacheKey, distance);
        return distance;
      }

      throw new Error('OSRM: No route found between the given coordinates.');
    } catch (error) {
      console.error(`Error calculating driving distance (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      
      if (retryCount === maxRetries) {
        // Calculate straight-line distance as a fallback
        const R = 6371; // Earth's radius in kilometers
        const dLat = toRad(coord2.lat - coord1.lat);
        const dLon = toRad(coord2.lng - coord1.lng);
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightLineDistance = R * c;
        
        // Cache the fallback result
        distanceCache.set(cacheKey, straightLineDistance);
        return straightLineDistance;
      }
      
      await delay(1000 * retryCount);
    }
  }

  throw new Error('Failed to calculate distance after all retries');
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

// Simple distance calculation for initial filtering
function quickDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface EmployeeWithQuickDistance {
  id: number;
  name: string;
  wage: number;
  address: string;
  coordinates: { latitude: number; longitude: number };
  quickDistance: number;
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
  eventCoordinates?: { latitude: number; longitude: number },
  requiredServers: number = 1
): Promise<EmployeeWithDistance[]> {
  try {
    // Get event coordinates
    const eventCoords = eventCoordinates 
      ? { lat: eventCoordinates.latitude, lng: eventCoordinates.longitude }
      : await getCoordinates(eventAddress);

    // Start with 20km radius and increase if needed
    let searchRadius = 20;
    let initialFiltered: EmployeeWithQuickDistance[] = [];
    
    // Keep expanding radius until we find enough employees or reach max radius
    while (initialFiltered.length < requiredServers && searchRadius <= 100) {
      initialFiltered = employees
        .filter(emp => emp.coordinates) // Remove employees without coordinates
        .map(emp => ({
          ...emp,
          coordinates: emp.coordinates!,
          quickDistance: quickDistance(
            eventCoords.lat,
            eventCoords.lng,
            emp.coordinates!.latitude,
            emp.coordinates!.longitude
          )
        }))
        .filter(emp => emp.quickDistance <= searchRadius);

      if (initialFiltered.length < requiredServers) {
        searchRadius += 20; // Increase radius by 20km
        console.log(`Not enough employees found within ${searchRadius - 20}km, expanding search to ${searchRadius}km`);
      }
    }

    // Sort by distance before taking the required number
    initialFiltered.sort((a, b) => a.quickDistance - b.quickDistance);

    // Only calculate precise distances for the filtered set
    const results = await Promise.all(
      initialFiltered.map(async (employee) => {
        const employeeCoords = {
          lat: employee.coordinates.latitude,
          lng: employee.coordinates.longitude
        };

        // Check cache first
        const cacheKey = getCacheKey(eventCoords, employeeCoords);
        let distance = distanceCache.get(cacheKey);

        if (distance === undefined) {
          // If not in cache, calculate and store
          distance = await calculateDistance(eventCoords, employeeCoords);
          distanceCache.set(cacheKey, distance);
        }

        return {
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          wage: employee.wage,
          distance
        };
      })
    );

    // Sort by distance and take only the required number
    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, requiredServers);
  } catch (error) {
    console.error('Error finding closest employees:', error);
    return employees.map(emp => ({
      id: emp.id,
      employeeId: emp.id,
      name: emp.name,
      wage: emp.wage,
      distance: 0
    }));
  }
}

// Current approach: Sequential processing
// Improved approach: Parallel processing with chunking
async function parallelProcessEmployees(employees: Employee[], eventCoords: Coordinates) {
  // Split employees into chunks of 10
  const chunkSize = 10;
  const chunks = [];
  
  for (let i = 0; i < employees.length; i += chunkSize) {
    chunks.push(employees.slice(i, i + chunkSize));
  }

  // Process chunks in parallel
  const results = await Promise.all(
    chunks.map(chunk => processEmployeeChunk(chunk, eventCoords))
  );

  return results.flat();
}

// Current approach: Makes API calls for every address
// Improved approach: Batch geocoding requests
async function batchGeocode(addresses: string[]) {
  // Instead of making separate API calls for each address
  // Make one API call with multiple addresses
  const coordinates = await Promise.all(
    addresses.map(address => getCoordinates(address))
  );
  return coordinates;
}

function processEmployeeChunk(chunk: Employee[], eventCoords: Coordinates): any {
  throw new Error('Function not implemented.');
}

// Add a maximum distance threshold to filter out employees who are too far
const MAX_DISTANCE = 50; // 50 kilometers

function filterByDistance(employees: EmployeeWithDistance[]) {
  return employees.filter(emp => emp.distance <= MAX_DISTANCE);
}
