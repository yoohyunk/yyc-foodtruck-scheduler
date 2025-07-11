import { createClient } from "./client";
import { Employee } from "@/app/types";

const supabase = createClient();

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

    return data || [];
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

    return data;
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

    return data || [];
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

    return data || [];
  },

  async createEmployee(
    employeeData: Omit<Employee, "employee_id" | "created_at">
  ): Promise<Employee> {
    const { data, error } = await supabase
      .from("employees")
      .insert([employeeData])
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
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
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
