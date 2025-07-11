import { createClient } from "./client";
import { Truck } from "@/app/types";

const supabase = createClient();

export const trucksApi = {
  async getAllTrucks(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trucks:", error);
      throw new Error("Failed to fetch trucks");
    }

    return data || [];
  },

  async getTruckById(id: string): Promise<Truck | null> {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching truck:", error);
      return null;
    }

    return data;
  },

  async getAvailableTrucks(): Promise<Truck[]> {
    const { data, error } = await supabase
      .from("trucks")
      .select("*")
      .eq("is_available", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching available trucks:", error);
      throw new Error("Failed to fetch available trucks");
    }

    return data || [];
  },

  // Check truck availability with conflict detection and 1-hour buffer
  async checkTruckAvailability(
    truckId: string,
    eventStartDate: string,
    eventEndDate: string,
    excludeEventId?: string
  ): Promise<{ isAvailable: boolean; reason: string }> {
    try {
      // First check if truck is marked as available
      const { data: truck, error: truckError } = await supabase
        .from("trucks")
        .select("is_available")
        .eq("id", truckId)
        .single();

      if (truckError) {
        console.error("Error fetching truck:", truckError);
        return { isAvailable: false, reason: "Truck not found" };
      }

      if (!truck.is_available) {
        return { isAvailable: false, reason: "Truck is marked as unavailable" };
      }

      // Check for conflicting truck assignments with 1-hour buffer
      let query = supabase
        .from("truck_assignment")
        .select("start_time, end_time, event_id")
        .eq("truck_id", truckId);

      if (excludeEventId) {
        query = query.neq("event_id", excludeEventId);
      }

      const { data: assignments, error: assignmentsError } = await query;

      if (assignmentsError) {
        console.error("Error fetching truck assignments:", assignmentsError);
        return { isAvailable: false, reason: "Error checking assignments" };
      }

      if (assignments && assignments.length > 0) {
        const eventStart = new Date(eventStartDate);
        const eventEnd = new Date(eventEndDate);

        // Add 1-hour buffer before and after the event
        const bufferedEventStart = new Date(
          eventStart.getTime() - 60 * 60 * 1000
        ); // 1 hour before
        const bufferedEventEnd = new Date(eventEnd.getTime() + 60 * 60 * 1000); // 1 hour after

        const hasConflict = assignments.some((assignment) => {
          const assignmentStart = new Date(assignment.start_time);
          const assignmentEnd = new Date(assignment.end_time);

          return (
            (assignmentStart <= bufferedEventStart &&
              assignmentEnd > bufferedEventStart) ||
            (assignmentStart < bufferedEventEnd &&
              assignmentEnd >= bufferedEventEnd) ||
            (assignmentStart >= bufferedEventStart &&
              assignmentEnd <= bufferedEventEnd)
          );
        });

        if (hasConflict) {
          return {
            isAvailable: false,
            reason:
              "Truck is assigned to another event during this time (including 1-hour buffer)",
          };
        }
      }

      return { isAvailable: true, reason: "" };
    } catch (error) {
      console.error("Error checking truck availability:", error);
      return { isAvailable: false, reason: "Error checking availability" };
    }
  },

  // Get available trucks for a specific time period
  async getAvailableTrucksForEvent(
    eventStartDate: string,
    eventEndDate: string,
    excludeEventId?: string
  ): Promise<Truck[]> {
    try {
      // Get all trucks that are marked as available
      const { data: trucks, error: trucksError } = await supabase
        .from("trucks")
        .select("*")
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (trucksError) {
        console.error("Error fetching trucks:", trucksError);
        throw new Error("Failed to fetch trucks");
      }

      if (!trucks || trucks.length === 0) {
        return [];
      }

      // Check availability for each truck
      const availableTrucks = await Promise.all(
        trucks.map(async (truck) => {
          const availability = await this.checkTruckAvailability(
            truck.id,
            eventStartDate,
            eventEndDate,
            excludeEventId
          );
          return {
            ...truck,
            isAvailable: availability.isAvailable,
            availabilityReason: availability.reason,
          };
        })
      );

      return availableTrucks.filter((truck) => truck.isAvailable);
    } catch (error) {
      console.error("Error getting available trucks for event:", error);
      throw new Error("Failed to get available trucks");
    }
  },

  async createTruck(
    truckData: Omit<Truck, "id" | "created_at">
  ): Promise<Truck> {
    const { data, error } = await supabase
      .from("trucks")
      .insert([truckData])
      .select()
      .single();

    if (error) {
      console.error("Error creating truck:", error);
      throw new Error("Failed to create truck");
    }

    return data;
  },

  async updateTruck(id: string, updates: Partial<Truck>): Promise<Truck> {
    const { data, error } = await supabase
      .from("trucks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating truck:", error);
      throw new Error("Failed to update truck");
    }

    return data;
  },

  async deleteTruck(id: string): Promise<void> {
    const { error } = await supabase.from("trucks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting truck:", error);
      throw new Error("Failed to delete truck");
    }
  },

  async updateTruckAvailability(
    id: string,
    isAvailable: boolean
  ): Promise<Truck> {
    const { data, error } = await supabase
      .from("trucks")
      .update({ is_available: isAvailable })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating truck availability:", error);
      throw new Error("Failed to update truck availability");
    }

    return data;
  },

  /**
   * Reusable function to check availability for all trucks
   * @param eventStartDate - Start date/time of the event (ISO string)
   * @param eventEndDate - End date/time of the event (ISO string)
   * @param excludeEventId - Optional event ID to exclude from conflict checking (useful when editing an event)
   * @returns Array of trucks with availability status and reasons
   */
  async truckAvailabilityCheck(
    eventStartDate: string,
    eventEndDate: string,
    excludeEventId?: string
  ): Promise<
    Array<Truck & { isAvailable: boolean; availabilityReason: string }>
  > {
    try {
      // Get all trucks
      const { data: trucks, error: trucksError } = await supabase
        .from("trucks")
        .select("*")
        .order("name", { ascending: true });

      if (trucksError) {
        console.error("Error fetching trucks:", trucksError);
        throw new Error("Failed to fetch trucks");
      }

      if (!trucks || trucks.length === 0) {
        return [];
      }

      // Check availability for each truck
      const trucksWithAvailability = await Promise.all(
        trucks.map(async (truck) => {
          const availability = await this.checkTruckAvailability(
            truck.id,
            eventStartDate,
            eventEndDate,
            excludeEventId
          );
          return {
            ...truck,
            isAvailable: availability.isAvailable,
            availabilityReason: availability.reason,
          };
        })
      );

      return trucksWithAvailability;
    } catch (error) {
      console.error("Error checking all trucks availability:", error);
      throw new Error("Failed to check trucks availability");
    }
  },
};
