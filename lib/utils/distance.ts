import { Employee } from "@/app/types";

/**
 * Convert degrees to radians
 */
export function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 */
export function calculateStraightLineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
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
  return R * c;
}

/**
 * Interface for employee with distance and wage data
 */
export interface EmployeeWithDistanceAndWage extends Employee {
  distance?: number;
  currentWage?: number;
  isAvailable?: boolean;
}

/**
 * Sort employees by distance first, then by wage if within 5km, with employees without addresses last
 * Only includes available employees
 */
export function sortEmployeesByDistanceAndWage(
  employees: EmployeeWithDistanceAndWage[]
): EmployeeWithDistanceAndWage[] {
  // Filter to only available employees
  const availableEmployees = employees.filter(
    (emp) => emp.isAvailable !== false
  );

  return availableEmployees.sort((a, b) => {
    // First priority: employees without addresses go last
    if (a.distance === Infinity && b.distance !== Infinity) {
      return 1; // a goes after b
    }
    if (a.distance !== Infinity && b.distance === Infinity) {
      return -1; // a goes before b
    }
    if (a.distance === Infinity && b.distance === Infinity) {
      // Both have no addresses, sort by wage (lower first)
      const wageComparison = (a.currentWage || 0) - (b.currentWage || 0);
      return wageComparison;
    }

    // Both have addresses, check if within 5km of each other
    if (Math.abs((a.distance || 0) - (b.distance || 0)) <= 5) {
      // If within 5km, sort by wage (lower first)
      const wageComparison = (a.currentWage || 0) - (b.currentWage || 0);
      return wageComparison;
    }
    // Otherwise sort by distance (closest first)
    const distanceComparison = (a.distance || 0) - (b.distance || 0);
    return distanceComparison;
  });
}

/**
 * Calculate distances for employees using database coordinates
 */
export function calculateEmployeeDistances(
  employees: Employee[],
  eventCoordinates: { lat: number; lng: number }
): EmployeeWithDistanceAndWage[] {
  return employees.map((employee) => {
    let distance = Infinity; // Default to infinity if no coordinates

    // Use database coordinates if available
    if (employee.addresses?.latitude && employee.addresses?.longitude) {
      const employeeCoords = {
        lat: parseFloat(employee.addresses.latitude),
        lng: parseFloat(employee.addresses.longitude),
      };

      try {
        distance = calculateStraightLineDistance(
          employeeCoords,
          eventCoordinates
        );
      } catch (error) {
        console.warn(
          `Failed to calculate distance for employee ${employee.first_name} ${employee.last_name}:`,
          error
        );
        distance = Infinity;
      }
    } else {
      console.warn(
        `No coordinates found for employee ${employee.first_name} ${employee.last_name}, skipping distance calculation`
      );
    }

    return {
      ...employee,
      distance,
    };
  });
}
