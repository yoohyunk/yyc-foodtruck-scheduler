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
};
