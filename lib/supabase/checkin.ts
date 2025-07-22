import { createClient } from "./client";
import { Tables } from "@/database.types";

type Address = {
  id: string;
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
};

export type CheckinRecord =
  | Tables<"truck_assignment_checkin">
  | Tables<"server_assignment_clockin">;

// Get all assignments (server/truck) for today
export async function getTodayAssignmentsForEmployee(employeeId: string) {
  const supabase = createClient();
  const now = new Date();

  // Use local time for today range (same as events)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Get server assignments
  const { data: serverAssignments, error: serverError } = await supabase
    .from("assignments")
    .select(`*, employees(*)`)
    .eq("employee_id", employeeId)
    .gte("start_date", startOfDay.toISOString())
    .lte("start_date", endOfDay.toISOString());

  // Get event info for server assignments
  if (serverAssignments && serverAssignments.length > 0) {
    const eventIds = serverAssignments
      .map((assignment) => assignment.event_id)
      .filter(Boolean);
    if (eventIds.length > 0) {
      const { data: events, error: eventsError } = await supabase
        .from("event_basic_info_view")
        .select("*")
        .in("id", eventIds);

      if (!eventsError && events) {
        // Get address_id list for address info
        const addressIds = events
          .map((event) => event.address_id)
          .filter(Boolean);

        let addressesMap: Record<string, Address> = {};

        if (addressIds.length > 0) {
          const { data: addresses, error: addressesError } = await supabase
            .from("addresses")
            .select("*")
            .in("id", addressIds);

          if (!addressesError && addresses) {
            addressesMap = addresses.reduce(
              (acc, address) => {
                acc[address.id] = address;
                return acc;
              },
              {} as Record<string, Address>
            );
          }
        }

        const eventsMap = events.reduce(
          (acc, event) => {
            // Add address info to event
            acc[event.id] = {
              ...event,
              address: event.address_id ? addressesMap[event.address_id] : null,
            };
            return acc;
          },
          {} as Record<string, Address>
        );

        // Add event info to server assignments
        serverAssignments.forEach((assignment) => {
          if (assignment.event_id && eventsMap[assignment.event_id]) {
            assignment.events = eventsMap[assignment.event_id];
          }
        });
      }
    }
  }

  // Get truck assignments (drivers)
  const { data: truckAssignments, error: truckError } = await supabase
    .from("truck_assignment")
    .select(`*, trucks(*), employees(*)`)
    .eq("driver_id", employeeId)
    .gte("start_time", startOfDay.toISOString())
    .lte("start_time", endOfDay.toISOString());

  // Get event info for truck assignments
  if (truckAssignments && truckAssignments.length > 0) {
    const eventIds = truckAssignments
      .map((assignment) => assignment.event_id)
      .filter(Boolean);

    if (eventIds.length > 0) {
      // Check if events table exists

      const { data: events, error: eventsError } = await supabase
        .from("event_basic_info_view")
        .select("*")
        .in("id", eventIds);

      if (!eventsError && events) {
        // Get address_id list for address info
        const addressIds = events
          .map((event) => event.address_id)
          .filter(Boolean);

        let addressesMap: Record<string, Address> = {};

        if (addressIds.length > 0) {
          const { data: addresses, error: addressesError } = await supabase
            .from("addresses")
            .select("*")
            .in("id", addressIds);

          if (!addressesError && addresses) {
            addressesMap = addresses.reduce(
              (acc, address) => {
                acc[address.id] = address;
                return acc;
              },
              {} as Record<string, Address>
            );
          }
        }

        const eventsMap = events.reduce(
          (acc, event) => {
            // Add address info to event
            acc[event.id] = {
              ...event,
              address: event.address_id ? addressesMap[event.address_id] : null,
            };
            return acc;
          },
          {} as Record<string, Address>
        );

        // Add event info to truck assignments
        truckAssignments.forEach((assignment) => {
          if (assignment.event_id && eventsMap[assignment.event_id]) {
            assignment.events = eventsMap[assignment.event_id];
          }
        });
      }
    }
  }

  if (serverError || truckError) {
    console.error("Error fetching today assignments:", serverError, truckError);
    throw serverError || truckError;
  }

  return {
    serverAssignments: serverAssignments || [],
    truckAssignments: truckAssignments || [],
  };
}

// Get checkin/checkout records (type-specific)
export async function getCheckinRecord(
  assignmentId: string,
  type: "server" | "truck"
) {
  const supabase = createClient();
  if (type === "truck") {
    const { data, error } = await supabase
      .from("truck_assignment_checkin")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("server_assignment_clockin")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  }
}

// Checkin - use local time (same as events)
export async function checkin(assignmentId: string, type: "server" | "truck") {
  const supabase = createClient();

  const now = new Date();
  // Format as local time string without timezone conversion (same as events)
  // Use local date and time to avoid timezone issues
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; // YYYY-MM-DDTHH:MM:SS

  let existing;
  if (type === "truck") {
    const { data } = await supabase
      .from("truck_assignment_checkin")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();
    existing = data;
  } else {
    const { data } = await supabase
      .from("server_assignment_clockin")
      .select("*")
      .eq("assignment_id", assignmentId)
      .single();
    existing = data;
  }

  if (existing && existing.clock_in_at) {
    return existing;
  }

  if (type === "truck") {
    const { data, error } = await supabase
      .from("truck_assignment_checkin")
      .insert({ assignment_id: assignmentId, clock_in_at: formatted })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("server_assignment_clockin")
      .insert({ assignment_id: assignmentId, clock_in_at: formatted })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// Checkout - use local time (same as events)
export async function checkout(assignmentId: string, type: "server" | "truck") {
  const supabase = createClient();

  const now = new Date();
  // Format as local time string without timezone conversion (same as events)
  // Use local date and time to avoid timezone issues
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const formatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`; // YYYY-MM-DDTHH:MM:SS

  if (type === "truck") {
    const { data, error } = await supabase
      .from("truck_assignment_checkin")
      .update({ clock_out_at: formatted })
      .eq("assignment_id", assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("server_assignment_clockin")
      .update({ clock_out_at: formatted })
      .eq("assignment_id", assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
