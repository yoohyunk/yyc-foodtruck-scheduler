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

      // Calculate distances and sort by distance (closest first)
      if (eventAddress && filteredEmployees.length > 0) {
        const { getCoordinates, calculateDistance } = await import(
          "@/app/AlgApi/distance"
        );
        const eventCoords = await getCoordinates(eventAddress);

        const employeesWithDistance = await Promise.all(
          filteredEmployees.map(async (employee) => {
            let distance = 0;
            if (employee.addresses) {
              const employeeAddress = `${employee.addresses.street}, ${employee.addresses.city}, ${employee.addresses.province}`;
              const employeeCoords = await getCoordinates(employeeAddress);
              distance = await calculateDistance(employeeCoords, eventCoords);
            }
            return { ...employee, distance };
          })
        );

        return employeesWithDistance.sort((a, b) => a.distance - b.distance);
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
