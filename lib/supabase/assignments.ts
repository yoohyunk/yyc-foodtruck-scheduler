import { createClient } from "./client";
import { Employee } from "@/app/types";
import { calculateDistance, getCoordinates } from "@/app/AlgApi/distance";
import { eventsApi } from "./events";

const supabase = createClient();

export const assignmentsApi = {
  // Get available servers for a specific date and time
  async getAvailableServers(
    eventDate: string,
    eventStartTime: string,
    eventEndTime: string,
    eventAddress: string
  ): Promise<Employee[]> {
    try {
      // Get all employees who are servers and available
      const { data: employees, error } = await supabase
        .from("employees")
        .select(
          `
          *,
          addresses (*)
        `
        )
        .eq("employee_type", "Server")
        .eq("is_available", true);

      if (error) {
        throw new Error(`Error fetching employees: ${error.message}`);
      }

      if (!employees) {
        return [];
      }

      // Get the day of the week for the event
      const eventDateTime = new Date(`${eventDate}T${eventStartTime}`);
      const dayOfWeek = eventDateTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
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

      // Filter employees based on availability and time off requests
      const availableEmployees = await Promise.all(
        employees.map(async (employee) => {
          // Check if employee has availability for this day
          const availability = employee.availability as string[] | null;
          if (!availability || !availability.includes(eventDay)) {
            return null;
          }

          // Check if employee has approved time off requests for this date
          const { data: timeOffRequests } = await supabase
            .from("time_off_request")
            .select("*")
            .eq("employee_id", employee.employee_id)
            .eq("status", "Accepted");

          if (timeOffRequests && timeOffRequests.length > 0) {
            // Check if any approved time off overlaps with the event
            const hasTimeOffConflict = timeOffRequests.some((request) => {
              const requestStart = new Date(request.start_datetime);
              const requestEnd = new Date(request.end_datetime);
              const eventStart = new Date(`${eventDate}T${eventStartTime}`);
              const eventEnd = new Date(`${eventDate}T${eventEndTime}`);

              // Check for overlap
              return (
                (requestStart <= eventStart && requestEnd > eventStart) ||
                (requestStart < eventEnd && requestEnd >= eventEnd) ||
                (requestStart >= eventStart && requestEnd <= eventEnd)
              );
            });

            if (hasTimeOffConflict) {
              return null;
            }
          }

          // Check for other event conflicts
          const { data: otherAssignments } = await supabase
            .from("assignments")
            .select("start_date, end_date")
            .eq("employee_id", employee.employee_id);

          if (otherAssignments && otherAssignments.length > 0) {
            const hasEventConflict = otherAssignments.some((assignment) => {
              const assignmentStart = new Date(assignment.start_date);
              const assignmentEnd = new Date(assignment.end_date);
              const eventStart = new Date(`${eventDate}T${eventStartTime}`);
              const eventEnd = new Date(`${eventDate}T${eventEndTime}`);

              return (
                (assignmentStart <= eventStart && assignmentEnd > eventStart) ||
                (assignmentStart < eventEnd && assignmentEnd >= eventEnd) ||
                (assignmentStart >= eventStart && assignmentEnd <= eventEnd)
              );
            });

            if (hasEventConflict) {
              return null;
            }
          }

          return employee;
        })
      );

      // Remove null values and calculate distances
      const validEmployees = availableEmployees.filter(
        (emp) => emp !== null
      ) as Employee[];

      if (validEmployees.length === 0) {
        return [];
      }

      // Calculate distances for all employees
      const employeesWithDistance = await Promise.all(
        validEmployees.map(async (employee) => {
          let distance = 0;

          if (employee.addresses) {
            const employeeAddress = `${employee.addresses.street}, ${employee.addresses.city}, ${employee.addresses.province}`;
            const employeeCoords = await getCoordinates(employeeAddress);
            const eventCoords = await getCoordinates(eventAddress);

            distance = await calculateDistance(employeeCoords, eventCoords);
          }

          return {
            ...employee,
            distance,
          };
        })
      );

      // Sort by distance (closest first)
      return employeesWithDistance.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error("Error getting available servers:", error);
      throw error;
    }
  },

  // Create server assignments for an event
  async createServerAssignments(
    eventId: string,
    serverIds: string[],
    eventDate: string,
    eventStartTime: string,
    eventEndTime: string
  ): Promise<void> {
    try {
      // Verify that all provided IDs are actually servers
      const { data: employees, error: verifyError } = await supabase
        .from("employees")
        .select("employee_id, employee_type")
        .in("employee_id", serverIds);

      if (verifyError) {
        throw new Error(`Error verifying employees: ${verifyError.message}`);
      }

      // Check if all employees are servers
      const nonServerEmployees = employees?.filter(
        (emp) => emp.employee_type !== "Server"
      );
      if (nonServerEmployees && nonServerEmployees.length > 0) {
        throw new Error(
          `The following employees are not servers: ${nonServerEmployees.map((emp) => emp.employee_id).join(", ")}`
        );
      }

      const assignments = serverIds.map((serverId) => ({
        employee_id: serverId,
        event_id: eventId,
        start_date: `${eventDate}T${eventStartTime}`,
        end_date: `${eventDate}T${eventEndTime}`,
        is_completed: false,
        status: "Accepted",
      }));

      const { error } = await supabase.from("assignments").insert(assignments);

      if (error) {
        throw new Error(`Error creating server assignments: ${error.message}`);
      }

      // Check if all required servers are assigned and update event status
      await this.checkAndUpdateEventStatus(eventId);
    } catch (error) {
      console.error("Error creating server assignments:", error);
      throw error;
    }
  },

  // Check if all required servers are assigned and update event status to Scheduled
  async checkAndUpdateEventStatus(eventId: string): Promise<void> {
    try {
      // Get event details to check required servers
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("number_of_servers_needed, status")
        .eq("id", eventId)
        .single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        return;
      }

      // Get current server assignments for this event
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id")
        .eq("event_id", eventId)
        .eq("status", "Accepted");

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        return;
      }

      // Check if all required servers are assigned
      const requiredServers = event.number_of_servers_needed || 0;
      const assignedServers = assignments?.length || 0;

      // If all required servers are assigned and event is not already Scheduled, update status
      if (assignedServers >= requiredServers && event.status !== "Scheduled") {
        await eventsApi.updateEventStatus(eventId, "Scheduled");
        console.log(
          `Event ${eventId} status updated to Scheduled - all ${requiredServers} servers assigned`
        );
      }
    } catch (error) {
      console.error("Error checking and updating event status:", error);
    }
  },

  // Get server assignments for an event
  async getServerAssignmentsByEventId(eventId: string): Promise<
    Array<{
      id: string;
      employee_id: string;
      event_id: string;
      start_date: string;
      end_date: string;
      is_completed: boolean;
      status: string;
      employees: Employee;
    }>
  > {
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          *,
          employees!inner(*)
        `
        )
        .eq("event_id", eventId)
        .eq("employees.employee_type", "Server");

      if (error) {
        throw new Error(`Error fetching server assignments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error getting server assignments:", error);
      throw error;
    }
  },

  // Add a single server assignment (for manual assignment)
  async addServerAssignment(
    eventId: string,
    serverId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    try {
      // Verify the employee is a server
      const { data: employee, error: verifyError } = await supabase
        .from("employees")
        .select("employee_id, employee_type")
        .eq("employee_id", serverId)
        .single();

      if (verifyError) {
        throw new Error(`Error verifying employee: ${verifyError.message}`);
      }

      if (employee.employee_type !== "Server") {
        throw new Error(`Employee ${serverId} is not a server`);
      }

      const assignment = {
        employee_id: serverId,
        event_id: eventId,
        start_date: startDate,
        end_date: endDate,
        is_completed: false,
        status: "Accepted",
      };

      const { error } = await supabase.from("assignments").insert(assignment);

      if (error) {
        throw new Error(`Error creating server assignment: ${error.message}`);
      }

      // Check if all required servers are assigned and update event status
      await this.checkAndUpdateEventStatus(eventId);
    } catch (error) {
      console.error("Error adding server assignment:", error);
      throw error;
    }
  },

  // Get all assignments for an employee
  async getAssignmentsByEmployeeId(employeeId: string): Promise<
    Array<{
      id: string;
      employee_id: string;
      event_id: string;
      start_date: string;
      end_date: string;
    }>
  > {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error(`Error fetching assignments: ${error.message}`);
    }

    return data || [];
  },

  // Get all truck assignments for an employee
  async getTruckAssignmentsByEmployeeId(employeeId: string): Promise<
    Array<{
      id: string;
      driver_id: string;
      event_id: string;
      start_date: string;
      end_date: string;
    }>
  > {
    const { data, error } = await supabase
      .from("truck_assignment")
      .select("*")
      .eq("driver_id", employeeId);

    if (error) {
      throw new Error(`Error fetching truck assignments: ${error.message}`);
    }

    return data || [];
  },

  // Remove a server assignment (for manual unassignment)
  async removeServerAssignment(
    assignmentId: string,
    eventId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        throw new Error(`Error removing server assignment: ${error.message}`);
      }

      // Check if all required servers are still assigned and update event status
      await this.checkAndUpdateEventStatus(eventId);
    } catch (error) {
      console.error("Error removing server assignment:", error);
      throw error;
    }
  },
};
