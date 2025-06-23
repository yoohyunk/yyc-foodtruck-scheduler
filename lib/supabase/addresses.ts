import { createClient } from "@/lib/supabase/client";
import { TablesInsert, TablesUpdate } from "@/database.types";

const supabase = createClient();

export const addressesApi = {
  // Create a new address
  async createAddress(addressData: TablesInsert<"addresses">) {
    const { data, error } = await supabase
      .from("addresses")
      .insert(addressData)
      .select()
      .single();

    if (error) {
      console.error("Error creating address:", error);
      throw error;
    }

    return data;
  },

  // Get address by ID
  async getAddressById(id: string) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching address:", error);
      throw error;
    }

    return data;
  },

  // Update address
  async updateAddress(id: string, updateData: TablesUpdate<"addresses">) {
    const { data, error } = await supabase
      .from("addresses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating address:", error);
      throw error;
    }

    return data;
  },

  // Delete address
  async deleteAddress(id: string) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting address:", error);
      throw error;
    }

    return true;
  },

  // Search addresses by city or street
  async searchAddresses(searchTerm: string) {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .or(`city.ilike.%${searchTerm}%,street.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error("Error searching addresses:", error);
      throw error;
    }

    return data;
  },

  // Get all addresses
  async getAllAddresses() {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error);
      throw error;
    }

    return data;
  },
};
