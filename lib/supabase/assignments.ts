import { createClient } from "./client";
import { Employee } from "@/app/types";
import { eventsApi } from "./events";
import { employeeAvailabilityApi } from "./employeeAvailability";

const supabase = createClient();

export const assignmentsApi = {
  // Get available servers for a specific date and time
  async getAvailableServers(
    eventDate: string,
    eventStartTime: string,
    eventEndTime: string,
    eventAddress: string,
    eventCoordinates?: { latitude: number; longitude: number }
  ): Promise<Employee[]> {
    const eventStartDate = `${eventDate}T${eventStartTime}`;
    const eventEndDate = `${eventDate}T${eventEndTime}`;
    return employeeAvailabilityApi.getAvailableServers(
      eventStartDate,
      eventEndDate,
      eventAddress,
      undefined, // excludeEventId
      eventCoordinates
    );
  },

  // Get available drivers for a specific date and time
  async getAvailableDrivers(
    eventDate: string,
    eventStartTime: string,
    eventEndTime: string,
    eventAddress: string
  ): Promise<Employee[]> {
    const eventStartDate = `${eventDate}T${eventStartTime}`;
    const eventEndDate = `${eventDate}T${eventEndTime}`;
    return employeeAvailabilityApi.getAvailableDrivers(
      eventStartDate,
      eventEndDate,
      eventAddress
    );
  },

  // Create server assignments for an event
  async createServerAssignments(
    eventId: string,
    employeeIds: string[],
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string
  ): Promise<void> {
    try {
      const assignments = employeeIds.map((employeeId) => ({
        employee_id: employeeId,
        event_id: eventId,
        start_date: `${startDate}T${startTime}`,
        end_date: `${endDate}T${endTime}`,
        status: "Accepted",
        is_completed: false,
      }));

      const { error } = await supabase.from("assignments").insert(assignments);

      if (error) {
        console.error("Error creating server assignments:", error);
        throw new Error("Failed to create server assignments");
      }
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
      console.log(
        "getServerAssignmentsByEventId called with eventId:",
        eventId
      );

      // First try to get assignments with full employee data
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
          *,
          employees!inner(*)
        `
        )
        .eq("event_id", eventId);

      console.log(
        "Server assignments query result - data:",
        data,
        "error:",
        error
      );

      if (error) {
        console.log(
          "Error with full employee data, trying limited view:",
          error
        );

        // If that fails, try with limited employee view
        const { data: limitedData, error: limitedError } = await supabase
          .from("assignments")
          .select(
            `
            *,
            employees_limited_view!inner(*)
          `
          )
          .eq("event_id", eventId);

        console.log(
          "Limited view query result - data:",
          limitedData,
          "error:",
          limitedError
        );

        if (limitedError) {
          throw new Error(
            `Error fetching server assignments: ${limitedError.message}`
          );
        }

        return limitedData || [];
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
      events: {
        id: string;
        title: string;
        start_date: string;
        end_date: string;
      };
    }>
  > {
    const { data, error } = await supabase
      .from("assignments")
      .select(
        `
        *,
        events (
          id,
          title,
          start_date,
          end_date
        )
      `
      )
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error(`Error fetching assignments: ${error.message}`);
    }

    return (data || []).map((item) => ({
      ...item,
      events: Array.isArray(item.events)
        ? item.events[0] || { title: null }
        : item.events,
    }));
  },

  // Get all truck assignments for an employee
  async getTruckAssignmentsByEmployeeId(employeeId: string): Promise<
    Array<{
      id: string;
      driver_id: string;
      event_id: string;
      start_time: string;
      end_time: string;
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
  // Remove a truck assignment (for manual unassignment)
  async removeTruckAssignment(assignmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("truck_assignment")
        .delete()
        .eq("id", assignmentId);

      if (error) {
        throw new Error(`Error removing truck assignment: ${error.message}`);
      }
      // Optionally, update event status if needed (not implemented here)
    } catch (error) {
      console.error("Error removing truck assignment:", error);
      throw error;
    }
  },
  // Get all assignments (for reports)
  async getAllAssignments(): Promise<
    Array<{
      id: string;
      employee_id: string | null;
      event_id: string | null;
      start_date: string;
      end_date: string;
      is_completed: boolean | null;
      status: string | null;
      created_at: string;
    }>
  > {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching all assignments: ${error.message}`);
    }

    return data || [];
  },

  // Get all truck assignments (for reports)
  async getAllTruckAssignments(): Promise<
    Array<{
      id: string;
      driver_id: string | null;
      event_id: string | null;
      start_time: string;
      end_time: string;
      created_at: string;
      truck_id: string | null;
    }>
  > {
    const { data, error } = await supabase
      .from("truck_assignment")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching all truck assignments: ${error.message}`);
    }

    return data || [];
  },

  // Update server assignments when event times change
  async updateServerAssignmentsForEvent(
    eventId: string,
    newStartDate: string,
    newEndDate: string
  ): Promise<void> {
    try {
      // Get all server assignments for this event
      const { data: assignments, error: fetchError } = await supabase
        .from("assignments")
        .select("id")
        .eq("event_id", eventId);

      if (fetchError) {
        throw new Error(
          `Error fetching server assignments: ${fetchError.message}`
        );
      }

      if (!assignments || assignments.length === 0) {
        return; // No assignments to update
      }

      // Update all assignments with new start and end dates
      const { error: updateError } = await supabase
        .from("assignments")
        .update({
          start_date: newStartDate,
          end_date: newEndDate,
        })
        .eq("event_id", eventId);

      if (updateError) {
        throw new Error(
          `Error updating server assignments: ${updateError.message}`
        );
      }

      console.log(
        `Updated ${assignments.length} server assignments for event ${eventId}`
      );
    } catch (error) {
      console.error("Error updating server assignments for event:", error);
      throw error;
    }
  },

  // Update individual assignment times
  async updateAssignmentTimes(
    assignmentId: string,
    newStartDate: string,
    newEndDate: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("assignments")
        .update({
          start_date: newStartDate,
          end_date: newEndDate,
        })
        .eq("id", assignmentId);

      if (error) {
        throw new Error(`Error updating assignment times: ${error.message}`);
      }

      console.log(`Updated assignment ${assignmentId} times`);
    } catch (error) {
      console.error("Error updating assignment times:", error);
      throw error;
    }
  },
};
