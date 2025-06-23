import { createClient } from "./client";
import { Event, TruckAssignment } from "@/app/types";

const supabase = createClient();

// 이벤트 관련 함수들
export const eventsApi = {
  // 모든 이벤트 가져오기
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }

    return data || [];
  },

  // 특정 이벤트 가져오기
  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return null;
    }

    return data;
  },

  // 새 이벤트 생성
  async createEvent(
    eventData: Omit<Event, "id" | "created_at">
  ): Promise<Event> {
    const { data, error } = await supabase
      .from("events")
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }

    return data;
  },

  // 이벤트 업데이트
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update event");
    }

    return data;
  },

  // 이벤트 삭제
  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }
  },
};

// 트럭 할당 관련 함수들
export const truckAssignmentsApi = {
  // 이벤트의 트럭 할당 가져오기
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

    return data || [];
  },

  // 트럭 할당 생성
  async createTruckAssignment(
    assignmentData: Omit<TruckAssignment, "id" | "created_at">
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

  // 트럭 할당 업데이트
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

  // 트럭 할당 삭제
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

  // 이벤트의 모든 트럭 할당 삭제
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
};
