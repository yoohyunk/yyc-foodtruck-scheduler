import { createClient } from "@/lib/supabase/client";
import { Event, TruckAssignment } from "@/app/types";
import { TablesInsert, TablesUpdate } from "@/database.types";
import { addressesApi } from "./addresses";

const supabase = createClient();

export const eventsApi = {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }

    return data || [];
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return null;
    }

    return data;
  },

  async createEvent(
    eventData: TablesInsert<"events"> & {
      addressData?: TablesInsert<"addresses">;
    }
  ) {
    let addressId = null;

    // If address data is provided, create address first
    if (eventData.addressData) {
      const address = await addressesApi.createAddress(eventData.addressData);
      addressId = address.id;
    }

    // Remove addressData from eventData before inserting
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addressData, ...eventDataWithoutAddress } = eventData;

    // Create event with address_id
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...eventDataWithoutAddress,
        address_id: addressId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      throw error;
    }

    return data;
  },

  async updateEvent(
    id: string,
    updateData: TablesUpdate<"events"> & {
      addressData?: TablesUpdate<"addresses">;
    }
  ) {
    let addressId = updateData.address_id;

    // If new address data is provided, create or update address
    if (updateData.addressData) {
      if (updateData.address_id) {
        // Update existing address
        await addressesApi.updateAddress(
          updateData.address_id,
          updateData.addressData
        );
        addressId = updateData.address_id;
      } else {
        // Create new address
        const address = await addressesApi.createAddress(
          updateData.addressData
        );
        addressId = address.id;
      }
    }

    // Remove addressData from updateData before updating
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addressData, ...updateDataWithoutAddress } = updateData;

    // Update event
    const { data, error } = await supabase
      .from("events")
      .update({
        ...updateDataWithoutAddress,
        address_id: addressId,
      })
      .eq("id", id)
      .select(
        `
        *,
        addresses (*)
      `
      )
      .single();

    if (error) {
      console.error("Error updating event:", error);
      throw error;
    }

    return data;
  },

  async deleteEvent(id: string): Promise<void> {
    // First get the event to check if it has an address
    const event = await this.getEventById(id);

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error("Error deleting event:", error);
      throw error;
    }

    // If event had an address, delete it too (if not used by other events)
    if (event && event.address_id) {
      try {
        await addressesApi.deleteAddress(event.address_id);
      } catch (addressError) {
        // Address might be used by other events, so we just log the error
        console.warn("Could not delete address:", addressError);
      }
    }
  },

  async updateEventStatus(id: string, status: string): Promise<Event> {
    const { data, error } = await supabase
      .from("events")
      .update({ status })
      .eq("id", id)
      .select(
        `
        *,
        addresses (*)
      `
      )
      .single();

    if (error) {
      console.error("Error updating event status:", error);
      throw error;
    }

    return data;
  },
};

export const truckAssignmentsApi = {
  async getTruckAssignmentsByEventId(
    eventId: string
  ): Promise<TruckAssignment[]> {
    const { data, error } = await supabase
      .from("truck_assignment")
      .select("*")
      .eq("event_id", eventId);

    if (error) {
      console.error("Error fetching truck assignments:", error);
      throw new Error("Failed to fetch truck assignments");
    }

    return (data || []).map((item) => ({
      ...item,
      events: Array.isArray(item.events) ? item.events[0] || { title: null } : item.events,
    }));
  },

  async createTruckAssignment(
    assignmentData: Omit<TablesInsert<"truck_assignment">, "created_at" | "id">
  ): Promise<TruckAssignment> {
    const { data, error } = await supabase
      .from("truck_assignment")
      .insert([assignmentData])
      .select()
      .single();

    if (error) {
      console.error("Error creating truck assignment:", error);
      throw new Error("Failed to create truck assignment");
    }

    return data;
  },

  async updateTruckAssignment(
    id: string,
    updates: Partial<TruckAssignment>
  ): Promise<TruckAssignment> {
    const { data, error } = await supabase
      .from("truck_assignment")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating truck assignment:", error);
      throw new Error("Failed to update truck assignment");
    }

    return data;
  },

  async deleteTruckAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from("truck_assignment")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting truck assignment:", error);
      throw new Error("Failed to delete truck assignment");
    }
  },

  async deleteTruckAssignmentsByEventId(eventId: string): Promise<void> {
    const { error } = await supabase
      .from("truck_assignment")
      .delete()
      .eq("event_id", eventId);

    if (error) {
      console.error("Error deleting truck assignments:", error);
      throw new Error("Failed to delete truck assignments");
    }
  },

  async getTruckAssignmentsByTruckId(
    truckId: string
  ): Promise<Array<{
    id: string;
    event_id: string;
    start_time: string;
    end_time: string;
    events: {
      id: string;
      title: string;
      start_date: string;
      end_date: string;
    };
  }>> {
    const { data, error } = await supabase
      .from("truck_assignment")
      .select(`
        id,
        event_id,
        start_time,
        end_time,
        events (
          id,
          title,
          start_date,
          end_date
        )
      `)
      .eq("truck_id", truckId);

    if (error) {
      console.error("Error fetching truck assignments:", error);
      throw new Error("Failed to fetch truck assignments");
    }

    return (data || []).map((item) => ({
      ...item,
      // If events is an array, take the first element; otherwise fallback to empty object
      events: Array.isArray(item.events) ? item.events[0] || {
        id: "",
        title: "",
        start_date: "",
        end_date: ""
      } : item.events
    }));
  },
};
