import { createClient } from "./client";
import { TimeOffRequest } from "@/app/types";

const supabase = createClient();

export const timeOffRequestsApi = {
  // Create a new time off request
  async createTimeOffRequest(data: {
    employee_id: string;
    start_datetime: string;
    end_datetime: string;
    reason: string;
    type: string;
    status?: string;
  }): Promise<TimeOffRequest> {
    const { data: result, error } = await supabase
      .from("time_off_request")
      .insert({
        employee_id: data.employee_id,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        reason: data.reason,
        type: data.type,
        status: data.status || "Pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating time off request: ${error.message}`);
    }

    return result;
  },

  // Get all time off requests
  async getAllTimeOffRequests(): Promise<TimeOffRequest[]> {
    const { data, error } = await supabase
      .from("time_off_request")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
    }

    return data || [];
  },

  // Get time off requests by employee ID
  async getTimeOffRequestsByEmployeeId(
    employeeId: string
  ): Promise<TimeOffRequest[]> {
    const { data, error } = await supabase
      .from("time_off_request")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching time off requests: ${error.message}`);
    }

    return data || [];
  },

  // Get a single time off request by ID
  async getTimeOffRequestById(id: string): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from("time_off_request")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(`Error fetching time off request: ${error.message}`);
    }

    return data;
  },

  // Update a time off request
  async updateTimeOffRequest(
    id: string,
    updates: Partial<{
      start_datetime: string;
      end_datetime: string;
      reason: string;
      type: string;
      status: string;
    }>
  ): Promise<TimeOffRequest> {
    const { data, error } = await supabase
      .from("time_off_request")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating time off request: ${error.message}`);
    }

    return data;
  },

  // Delete a time off request
  async deleteTimeOffRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from("time_off_request")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Error deleting time off request: ${error.message}`);
    }
  },
};
