import { createClient } from "./client";
import { Employee } from "@/app/types";

const supabase = createClient();

export const employeesApi = {
  // 모든 직원 가져오기
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

  // 특정 직원 가져오기
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

  // 사용 가능한 드라이버 가져오기
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

  // 사용 가능한 서버 가져오기
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

  // 새 직원 생성
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

  // 직원 업데이트
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

  // 직원 삭제
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
};
