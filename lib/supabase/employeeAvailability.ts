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

  async upsertEmployeeAvailability(
    employeeId: string,
    availability: EmployeeAvailability
  ): Promise<EmployeeAvailability> {
    const { data, error } = await supabase
      .from("employee_availability")
      .upsert({ ...availability, employee_id: employeeId })
      .select()
      .single();

    if (error) {
      throw new Error("Failed to upsert employee availability");
    }

    return data;
  },

  async deleteEmployeeAvailability(availabilityId: string): Promise<void> {
    const { error } = await supabase
      .from("employee_availability")
      .delete()
      .eq("id", availabilityId);

    if (error) {
      throw new Error("Failed to delete employee availability");
    }
  },
};
