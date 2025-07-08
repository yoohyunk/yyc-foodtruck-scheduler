import { createClient } from "@/lib/supabase/client";
import { TablesInsert } from "@/database.types";

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

  // Update wage record with history
  // if the wage is being updated, we need to create a new wage record with the new wage and the end_date of the old wage
  // we need to update the employee with the new wage
  // we need to update the employee with the new wage
  // we need to delete the old wage record

  async updateWage(id: string, newWageValue: number) {
    const { data: wageRows, error: wageFetchError } = await supabase
      .from("wage")
      .select("*")
      .eq("employee_id", id)
      .order("start_date", { ascending: false });

    if (wageFetchError) {
      console.error("Error fetching wages:", wageFetchError);
      throw wageFetchError;
    }

    const currentWage = wageRows && wageRows.length > 0 ? wageRows[0] : null;

    if (!currentWage || currentWage.hourly_wage !== newWageValue) {
      if (currentWage) {
        await supabase
          .from("wage")
          .update({ end_date: new Date().toISOString() })
          .eq("id", currentWage.id);
      }
      const wageData = {
        employee_id: id as string,
        hourly_wage: newWageValue,
        start_date: new Date().toISOString(),
        end_date: null,
      };
      const { data: newWage, error: insertError } = await supabase
        .from("wage")
        .insert(wageData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating new wage:", insertError);
        throw insertError;
      }

      return newWage;
    }

    return currentWage;
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
