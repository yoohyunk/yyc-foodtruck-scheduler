import { createClient } from "./client";
import { EmployeeAvailability, Employee } from "@/app/types";

const supabase = createClient();

export const employeeAvailabilityApi = {
  async getEmployeeAvailability(
    employeeId: string
  ): Promise<EmployeeAvailability[]> {
    const { data, error } = await supabase
      .from("employee_availability")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error("Failed to fetch employee availability");
    }

    return data || [];
  },

  async upsertEmployeeAvailability(
    employeeId: string,
    availability: EmployeeAvailability
  ): Promise<EmployeeAvailability> {
    const { data, error } = await supabase
      .from("employee_availability")
      .upsert({ ...availability, employee_id: employeeId })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to upsert employee availability");
    }

    return data;
  },

  async deleteEmployeeAvailability(availabilityId: string): Promise<void> {
    const { error } = await supabase
      .from("employee_availability")
      .delete()
      .eq("id", availabilityId);

    if (error) {
      throw new Error("Failed to delete employee availability");
    }
  },

  // Comprehensive employee availability checking function
  async checkEmployeeAvailability(
    employee: Employee,
    eventStartDate: string,
    eventEndDate: string,
    excludeEventId?: string
  ): Promise<{ isAvailable: boolean; reason: string }> {
    try {
      // First check if employee is marked as available
      if (!employee.is_available) {
        return {
          isAvailable: false,
          reason: "Employee is marked as unavailable",
        };
      }

      // Parse event times
      const eventStart = new Date(eventStartDate);
      const eventEnd = new Date(eventEndDate);
      const dayOfWeek = eventStart.getDay();
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const eventDay = dayNames[dayOfWeek];

      // Check day availability
      const availability = employee.availability as string[] | null;
      if (!availability || !availability.includes(eventDay)) {
        return {
          isAvailable: false,
          reason: `Not available on ${eventDay}`,
        };
      }

      // Check for time off conflicts
      const { data: timeOffRequests, error: timeOffError } = await supabase
        .from("time_off_request")
        .select("*")
        .eq("employee_id", employee.employee_id)
        .eq("status", "Accepted");

      if (timeOffError) {
        console.error("Error fetching time off requests:", timeOffError);
        return {
          isAvailable: false,
          reason: "Error checking time off requests",
        };
      }

      if (timeOffRequests && timeOffRequests.length > 0) {
        const hasTimeOffConflict = timeOffRequests.some((request) => {
          const requestStart = new Date(request.start_datetime);
          const requestEnd = new Date(request.end_datetime);

          return (
            (requestStart <= eventStart && requestEnd > eventStart) ||
            (requestStart < eventEnd && requestEnd >= eventEnd) ||
            (requestStart >= eventStart && requestEnd <= eventEnd)
          );
        });

        if (hasTimeOffConflict) {
          return {
            isAvailable: false,
            reason: "Has approved time off during this period",
          };
        }
      }

      // Check for server assignment conflicts
      let serverAssignmentsQuery = supabase
        .from("assignments")
        .select("start_date, end_date")
        .eq("employee_id", employee.employee_id);

      if (excludeEventId) {
        serverAssignmentsQuery = serverAssignmentsQuery.neq(
          "event_id",
          excludeEventId
        );
      }

      const { data: serverAssignments, error: serverAssignmentsError } =
        await serverAssignmentsQuery;

      if (serverAssignmentsError) {
        console.error(
          "Error fetching server assignments:",
          serverAssignmentsError
        );
        return {
          isAvailable: false,
          reason: "Error checking server assignments",
        };
      }

      if (serverAssignments && serverAssignments.length > 0) {
        const hasServerConflict = serverAssignments.some((assignment) => {
          const assignmentStart = new Date(assignment.start_date);
          const assignmentEnd = new Date(assignment.end_date);

          return (
            (assignmentStart <= eventStart && assignmentEnd > eventStart) ||
            (assignmentStart < eventEnd && assignmentEnd >= eventEnd) ||
            (assignmentStart >= eventStart && assignmentEnd <= eventEnd)
          );
        });

        if (hasServerConflict) {
          return {
            isAvailable: false,
            reason: "Assigned to another event during this time",
          };
        }
      }

      // Check for truck assignment conflicts (for drivers)
      if (employee.employee_type === "Driver") {
        let truckAssignmentsQuery = supabase
          .from("truck_assignment")
          .select("start_time, end_time")
          .eq("driver_id", employee.employee_id);

        if (excludeEventId) {
          truckAssignmentsQuery = truckAssignmentsQuery.neq(
            "event_id",
            excludeEventId
          );
        }

        const { data: truckAssignments, error: truckAssignmentsError } =
          await truckAssignmentsQuery;

        if (truckAssignmentsError) {
          console.error(
            "Error fetching truck assignments:",
            truckAssignmentsError
          );
          return {
            isAvailable: false,
            reason: "Error checking truck assignments",
          };
        }

        if (truckAssignments && truckAssignments.length > 0) {
          const hasTruckConflict = truckAssignments.some((assignment) => {
            const assignmentStart = new Date(assignment.start_time);
            const assignmentEnd = new Date(assignment.end_time);

            return (
              (assignmentStart <= eventStart && assignmentEnd > eventStart) ||
              (assignmentStart < eventEnd && assignmentEnd >= eventEnd) ||
              (assignmentStart >= eventStart && assignmentEnd <= eventEnd)
            );
          });

          if (hasTruckConflict) {
            return {
              isAvailable: false,
              reason: "Assigned to drive another truck during this time",
            };
          }
        }
      }

      return { isAvailable: true, reason: "" };
    } catch (error) {
      console.error("Error checking employee availability:", error);
      return { isAvailable: false, reason: "Error checking availability" };
    }
  },

  // Get available employees for a specific date and time with comprehensive checking
  async getAvailableEmployees(
    employeeType: "Server" | "Driver" | "Manager" | "all",
    eventStartDate: string,
    eventEndDate: string,
    eventAddress: string,
    excludeEventId?: string
  ): Promise<Employee[]> {
    try {
      // Build query to get employees
      let query = supabase
        .from("employees")
        .select(
          `
          *,
          addresses (*)
        `
        )
        .eq("is_available", true);

      // Filter by employee type if specified
      if (employeeType !== "all") {
        query = query.eq("employee_type", employeeType);
      }

      const { data: employees, error } = await query;

      if (error) {
        throw new Error(`Error fetching employees: ${error.message}`);
      }

      if (!employees || employees.length === 0) {
        return [];
      }

      // Get the day of the week for the event
      const eventDateTime = new Date(eventStartDate);
      const dayOfWeek = eventDateTime.getDay();
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const eventDay = dayNames[dayOfWeek];

      // Filter employees by day availability first (fast filter)
      const employeesWithDayAvailability = employees.filter((employee) => {
        const availability = employee.availability as string[] | null;
        return availability && availability.includes(eventDay);
      });

      if (employeesWithDayAvailability.length === 0) {
        return [];
      }

      // Check availability for each employee
      const availableEmployees = await Promise.all(
        employeesWithDayAvailability.map(async (employee) => {
          const availability = await this.checkEmployeeAvailability(
            employee,
            eventStartDate,
            eventEndDate,
            excludeEventId
          );
          return {
            ...employee,
            isAvailable: availability.isAvailable,
            availabilityReason: availability.reason,
          };
        })
      );

      // Filter to only available employees
      const filteredEmployees = availableEmployees.filter(
        (employee) => employee.isAvailable
      );

      // Calculate distances using database coordinates and sort by distance + wage
      if (eventAddress && filteredEmployees.length > 0) {
        // Get event coordinates from the address
        const { getCoordinates } = await import("@/app/AlgApi/distance");
        const eventCoords = await getCoordinates(eventAddress);

        const employeesWithDistance = await Promise.all(
          filteredEmployees.map(async (employee) => {
            let distance = Infinity; // Default to infinity if no coordinates

            // Use database coordinates if available
            if (employee.addresses?.latitude && employee.addresses?.longitude) {
              const employeeCoords = {
                lat: parseFloat(employee.addresses.latitude),
                lng: parseFloat(employee.addresses.longitude),
              };

              // Use our distance API for accurate calculations
              try {
                const coord1Str = `${employeeCoords.lat.toFixed(6)},${employeeCoords.lng.toFixed(6)}`;
                const coord2Str = `${eventCoords.lat.toFixed(6)},${eventCoords.lng.toFixed(6)}`;

                const response = await fetch(
                  `/api/route/distance?coord1=${encodeURIComponent(coord1Str)}&coord2=${encodeURIComponent(coord2Str)}`,
                  { method: "GET" }
                );

                if (response.ok) {
                  const data = await response.json();
                  if (data.success) {
                    distance = data.distance;
                  }
                }
              } catch (error) {
                console.warn(
                  `Failed to calculate distance for ${employee.first_name} ${employee.last_name}:`,
                  error
                );
                // Fallback to straight-line distance calculation
                const R = 6371; // Earth's radius in kilometers
                const dLat = toRad(eventCoords.lat - employeeCoords.lat);
                const dLon = toRad(eventCoords.lng - employeeCoords.lng);
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(employeeCoords.lat)) *
                    Math.cos(toRad(eventCoords.lat)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                distance = R * c;
              }
            }

            return { ...employee, distance };
          })
        );

        // Sort by distance first, then by wage if within 5km, with employees without addresses last
        // IMPORTANT: Only return employees that are actually available (isAvailable: true)
        const availableEmployeesWithDistance = employeesWithDistance.filter(
          (employee) => employee.isAvailable === true
        );

        return availableEmployeesWithDistance.sort((a, b) => {
          // First priority: employees without addresses go last
          if (a.distance === Infinity && b.distance !== Infinity) {
            return 1; // a goes after b
          }
          if (a.distance !== Infinity && b.distance === Infinity) {
            return -1; // a goes before b
          }
          if (a.distance === Infinity && b.distance === Infinity) {
            // Both have no addresses, sort by wage (lower first)
            return (a.currentWage || 0) - (b.currentWage || 0);
          }

          // Both have addresses, check if within 5km of each other
          if (Math.abs(a.distance - b.distance) <= 5) {
            // If within 5km, sort by wage (lower first)
            return (a.currentWage || 0) - (b.currentWage || 0);
          }
          // Otherwise sort by distance (closest first)
          return a.distance - b.distance;
        });
      }

      return filteredEmployees;
    } catch (error) {
      console.error("Error getting available employees:", error);
      throw error;
    }
  },

  // Convenience functions for specific employee types
  async getAvailableServers(
    eventStartDate: string,
    eventEndDate: string,
    eventAddress: string,
    excludeEventId?: string
  ): Promise<Employee[]> {
    return this.getAvailableEmployees(
      "Server",
      eventStartDate,
      eventEndDate,
      eventAddress,
      excludeEventId
    );
  },

  async getAvailableDrivers(
    eventStartDate: string,
    eventEndDate: string,
    eventAddress: string,
    excludeEventId?: string
  ): Promise<Employee[]> {
    return this.getAvailableEmployees(
      "Driver",
      eventStartDate,
      eventEndDate,
      eventAddress,
      excludeEventId
    );
  },

  async getAvailableManagers(
    eventStartDate: string,
    eventEndDate: string,
    eventAddress: string,
    excludeEventId?: string
  ): Promise<Employee[]> {
    return this.getAvailableEmployees(
      "Manager",
      eventStartDate,
      eventEndDate,
      eventAddress,
      excludeEventId
    );
  },
};

// Helper function for distance calculations
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
