import { createClient } from "@/lib/supabase/client";
import { TablesInsert, TablesUpdate } from "@/database.types";

const supabase = createClient();

export const wagesApi = {
  // Get current wage for an employee (most recent active wage)
  async getCurrentWage(employeeId: string) {
    const { data, error } = await supabase
      .from("wage")
      .select("*")
      .eq("employee_id", employeeId)
      .is("end_date", null) // No end date means it's still active
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
  async createWage(wageData: TablesInsert<"wage">) {
    const { data, error } = await supabase
      .from("wage")
      .insert(wageData)
      .select()
      .single();

    if (error) {
      console.error("Error creating wage:", error);
      throw error;
    }

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
