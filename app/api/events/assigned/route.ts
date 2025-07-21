import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Get employee_id from user_id
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("employee_id")
      .eq("user_id", userId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // 2. Get server assignments
    const { data: serverAssignments, error: serverError } = await supabase
      .from("assignments")
      .select("event_id")
      .eq("employee_id", employee.employee_id);

    if (serverError) {
      console.error("Error fetching server assignments:", serverError);
      return NextResponse.json(
        { error: "Failed to fetch server assignments" },
        { status: 500 }
      );
    }

    // 3. Get truck assignments
    const { data: truckAssignments, error: truckError } = await supabase
      .from("truck_assignment")
      .select("event_id")
      .eq("driver_id", employee.employee_id);

    if (truckError) {
      console.error("Error fetching truck assignments:", truckError);
      return NextResponse.json(
        { error: "Failed to fetch truck assignments" },
        { status: 500 }
      );
    }

    // 4. Collect unique event IDs
    const eventIds = new Set<string>();
    serverAssignments?.forEach((a) => a.event_id && eventIds.add(a.event_id));
    truckAssignments?.forEach((a) => a.event_id && eventIds.add(a.event_id));

    if (eventIds.size === 0) {
      return NextResponse.json({ events: [] });
    }

    // 5. Fetch events with addresses
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        *,
        addresses (*)
      `
      )
      .in("id", Array.from(eventIds));

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // 6. Sort events by start date
    const sortedEvents =
      events?.sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return dateA - dateB;
      }) || [];

    return NextResponse.json({ events: sortedEvents });
  } catch (error) {
    console.error("Error in assigned events API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
