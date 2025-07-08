import { createClient } from "./client";
import { EmployeeAvailability } from "@/app/types";

const supabase = createClient();

export const employeeAvailabilityApi = {
  async getEmployeeAvailability(
    employeeId: string
  ): Promise<EmployeeAvailability[]> {
    const { data, error } = await supabase
      .from("employee_availability")
      .select("*")
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error("Failed to fetch employee availability");
    }

    return data || [];
  },

  async createEmployeeAvailability(
    employeeId: string,
    availability: EmployeeAvailability
  ): Promise<EmployeeAvailability> {
    const { data, error } = await supabase
      .from("employee_availability")
      .insert(availability)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to create employee availability");
    }

    return data;
  },

  async updateEmployeeAvailability(
    employeeId: string,
    availability: EmployeeAvailability
  ): Promise<EmployeeAvailability> {
    const { data, error } = await supabase
      .from("employee_availability")
      .update(availability)
      .eq("employee_id", employeeId)
      .select()
      .single();

    if (error) {
      throw new Error("Failed to update employee availability");
    }

    return data;
  },

  async deleteEmployeeAvailability(employeeId: string): Promise<void> {
    const { error } = await supabase
      .from("employee_availability")
      .delete()
      .eq("employee_id", employeeId);

    if (error) {
      throw new Error("Failed to delete employee availability");
    }
  },
};
