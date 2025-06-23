import { createClient } from "@/lib/supabase/client";
import { TablesInsert, TablesUpdate } from "@/database.types";

const supabase = createClient();

export const wagesApi = {
  // Get current wage for an employee (most recent wage)
  async getCurrentWage(employeeId: string) {
    const { data, error } = await supabase
      .from("wage")
      .select("*")
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching current wage:", error);
      return null;
    }

    return data;
  },

  // Get all wages for an employee
  async getWagesByEmployeeId(employeeId: string) {
    const { data, error } = await supabase
      .from("wage")
      .select("*")
      .eq("employee_id", employeeId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching wages:", error);
      throw error;
    }

    return data;
  },

  // Create a new wage record
  async createWage(
    wageData: Omit<TablesInsert<"wage">, "end_date"> & {
      end_date?: string | null;
    }
  ) {
    console.log("Creating wage with data:", wageData);

    // If end_date is not provided, set it to null or a default value
    const wageDataWithDefaults = {
      ...wageData,
      end_date: wageData.end_date || null,
    };

    console.log("Wage data with defaults:", wageDataWithDefaults);

    const { data, error } = await supabase
      .from("wage")
      .insert(wageDataWithDefaults)
      .select()
      .single();

    if (error) {
      console.error("Error creating wage:", error);
      console.error("Error details:", error.details);
      console.error("Error hint:", error.hint);
      console.error("Error message:", error.message);
      throw error;
    }

    console.log("Wage created successfully:", data);
    return data;
  },

  // Update wage record
  async updateWage(id: string, updateData: TablesUpdate<"wage">) {
    const { data, error } = await supabase
      .from("wage")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating wage:", error);
      throw error;
    }

    return data;
  },

  // Delete wage record
  async deleteWage(id: string) {
    const { error } = await supabase.from("wage").delete().eq("id", id);

    if (error) {
      console.error("Error deleting wage:", error);
      throw error;
    }

    return true;
  },
};
