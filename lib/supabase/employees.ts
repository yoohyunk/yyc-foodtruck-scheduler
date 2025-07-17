import { createClient } from "./client";
import { Employee } from "@/app/types";

const supabase = createClient();

// Helper function to capitalize each word
function capitalizeWords(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const employeesApi = {
  async getAllEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employees:", error);
      throw new Error("Failed to fetch employees");
    }

    // Auto-capitalize names
    return (data || []).map((emp) => ({
      ...emp,
      first_name: capitalizeWords(emp.first_name),
      last_name: capitalizeWords(emp.last_name),
    }));
  },

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .eq("employee_id", employeeId)
      .single();

    if (error) {
      console.error("Error fetching employee:", error);
      return null;
    }

    // Auto-capitalize names
    return data
      ? {
          ...data,
          first_name: capitalizeWords(data.first_name),
          last_name: capitalizeWords(data.last_name),
        }
      : null;
  },

  async getAvailableDrivers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .eq("employee_type", "Driver")
      .eq("is_available", true)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching available drivers:", error);
      throw new Error("Failed to fetch available drivers");
    }

    // Auto-capitalize names
    return (data || []).map((emp) => ({
      ...emp,
      first_name: capitalizeWords(emp.first_name),
      last_name: capitalizeWords(emp.last_name),
    }));
  },

  async getAvailableServers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from("employees")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .eq("employee_type", "Server")
      .eq("is_available", true)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Error fetching available servers:", error);
      throw new Error("Failed to fetch available servers");
    }

    // Auto-capitalize names
    return (data || []).map((emp) => ({
      ...emp,
      first_name: capitalizeWords(emp.first_name),
      last_name: capitalizeWords(emp.last_name),
    }));
  },

  async createEmployee(
    employeeData: Omit<Employee, "employee_id" | "created_at">
  ): Promise<Employee> {
    // Capitalize names before sending to DB
    const dataToSend = {
      ...employeeData,
      first_name: capitalizeWords(employeeData.first_name),
      last_name: capitalizeWords(employeeData.last_name),
    };
    const { data, error } = await supabase
      .from("employees")
      .insert([dataToSend])
      .select()
      .single();

    if (error) {
      console.error("Error creating employee:", error);
      throw new Error("Failed to create employee");
    }

    return data;
  },

  async updateEmployee(
    employeeId: string,
    updates: Partial<Employee>
  ): Promise<Employee> {
    // Capitalize names before sending to DB
    const updatesToSend = {
      ...updates,
      first_name: capitalizeWords(updates.first_name),
      last_name: capitalizeWords(updates.last_name),
    };
    const { data, error } = await supabase
      .from("employees")
      .update(updatesToSend)
      .eq("employee_id", employeeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating employee:", error);
      throw new Error("Failed to update employee");
    }

    return data;
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("employee_id", employeeId);

    if (error) {
      console.error("Error deleting employee:", error);
      throw new Error("Failed to delete employee");
    }
  },

  async checkIfPhoneExists(
    phone: string,
    employeeId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_phone", phone)
      .neq("employee_id", employeeId)
      .single();

    if (error) {
      throw new Error("Failed to check if phone exists");
    }

    return data !== null;
  },

  async checkIfEmailExists(
    email: string,
    employeeId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_email", email)
      .neq("employee_id", employeeId)
      .single();

    if (error) {
      throw new Error("Failed to check if email exists");
    }

    return data !== null;
  },
};
