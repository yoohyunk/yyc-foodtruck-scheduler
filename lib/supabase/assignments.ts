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

      // Filter employees by availability first (fast filter)
      const employeesWithAvailability = employees.filter((employee) => {
        const availability = employee.availability as string[] | null;
        return availability && availability.includes(eventDay);
      });

      if (employeesWithAvailability.length === 0) {
        return [];
      }

      // Get all employee IDs for batch queries
      const employeeIds = employeesWithAvailability.map(
        (emp) => emp.employee_id
      );

      // Batch query 1: Get all time off requests for these employees
      const { data: allTimeOffRequests } = await supabase
        .from("time_off_request")
        .select("*")
        .in("employee_id", employeeIds)
        .eq("status", "Accepted");

      // Batch query 2: Get all assignments for these employees
      const { data: allAssignments } = await supabase
        .from("assignments")
        .select("employee_id, start_date, end_date")
        .in("employee_id", employeeIds);

      // Create lookup maps for faster access
      const timeOffMap = new Map();
      const assignmentsMap = new Map();

      if (allTimeOffRequests) {
        allTimeOffRequests.forEach((request) => {
          if (!timeOffMap.has(request.employee_id)) {
            timeOffMap.set(request.employee_id, []);
          }
          timeOffMap.get(request.employee_id).push(request);
        });
      }

      if (allAssignments) {
        allAssignments.forEach((assignment) => {
          if (!assignmentsMap.has(assignment.employee_id)) {
            assignmentsMap.set(assignment.employee_id, []);
          }
          assignmentsMap.get(assignment.employee_id).push(assignment);
        });
      }

      // Filter employees based on conflicts
      const eventStart = new Date(`${eventDate}T${eventStartTime}`);
      const eventEnd = new Date(`${eventDate}T${eventEndTime}`);

      const availableEmployees = employeesWithAvailability.filter(
        (employee) => {
          // Check time off conflicts
          const employeeTimeOff = timeOffMap.get(employee.employee_id) || [];
          const hasTimeOffConflict = employeeTimeOff.some(
            (request: { start_datetime: string; end_datetime: string }) => {
              const requestStart = new Date(request.start_datetime);
              const requestEnd = new Date(request.end_datetime);
              return (
                (requestStart <= eventStart && requestEnd > eventStart) ||
                (requestStart < eventEnd && requestEnd >= eventEnd) ||
                (requestStart >= eventStart && requestEnd <= eventEnd)
              );
            }
          );

          if (hasTimeOffConflict) {
            return false;
          }

          // Check assignment conflicts
          const employeeAssignments =
            assignmentsMap.get(employee.employee_id) || [];
          const hasEventConflict = employeeAssignments.some(
            (assignment: { start_date: string; end_date: string }) => {
              const assignmentStart = new Date(assignment.start_date);
              const assignmentEnd = new Date(assignment.end_date);
              return (
                (assignmentStart <= eventStart && assignmentEnd > eventStart) ||
                (assignmentStart < eventEnd && assignmentEnd >= eventEnd) ||
                (assignmentStart >= eventStart && assignmentEnd <= eventEnd)
              );
            }
          );

          return !hasEventConflict;
        }
      );

      // Get event coordinates once (cached by the distance API)
      const eventCoords = await getCoordinates(eventAddress);

      // Calculate distances for all employees in parallel
      const employeesWithDistance = await Promise.all(
        availableEmployees.map(async (employee) => {
          let distance = 0;

          if (employee.addresses) {
            const employeeAddress = `${employee.addresses.street}, ${employee.addresses.city}, ${employee.addresses.province}`;
            const employeeCoords = await getCoordinates(employeeAddress);
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
    eventStartDate: string,
    eventStartTime: string,
    eventEndDate: string,
    eventEndTime: string
  ): Promise<void> {
    try {
      // Verify that all provided IDs are actually servers
      const { error: verifyError } = await supabase
        .from("employees")
        .select("employee_id, employee_type")
        .in("employee_id", serverIds);

      if (verifyError) {
        throw new Error(`Error verifying employees: ${verifyError.message}`);
      }

      // Check if all employees are servers

      const assignments = serverIds.map((serverId) => ({
        employee_id: serverId,
        event_id: eventId,
        start_date: `${eventStartDate}T${eventStartTime}`,
        end_date: `${eventEndDate}T${eventEndTime}`,
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
        .eq("event_id", eventId);

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
      const { error: verifyError } = await supabase
        .from("employees")
        .select("employee_id, employee_type")
        .eq("employee_id", serverId)
        .single();

      if (verifyError) {
        throw new Error(`Error verifying employee: ${verifyError.message}`);
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
