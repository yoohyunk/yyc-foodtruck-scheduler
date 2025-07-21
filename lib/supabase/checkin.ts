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

// 오늘 날짜에 해당하는 내 assignments(서버/트럭)를 모두 가져오기
export async function getTodayAssignmentsForEmployee(employeeId: string) {
  const supabase = createClient();
  const now = new Date();
  // Use UTC for today range
  const startOfDayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const endOfDayUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59
    )
  );

  // 서버 어싸인먼트
  const { data: serverAssignments, error: serverError } = await supabase
    .from("assignments")
    .select(`*, employees(*)`)
    .eq("employee_id", employeeId)
    .gte("start_date", startOfDayUTC.toISOString())
    .lte("start_date", endOfDayUTC.toISOString());

  // 서버 어싸인먼트의 이벤트 정보를 별도로 가져오기
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
        // 주소 정보를 가져오기 위한 address_id 목록
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
            // 이벤트에 주소 정보 추가
            acc[event.id] = {
              ...event,
              address: event.address_id ? addressesMap[event.address_id] : null,
            };
            return acc;
          },
          {} as Record<string, Address>
        );

        // 서버 어싸인먼트에 이벤트 정보 추가
        serverAssignments.forEach((assignment) => {
          if (assignment.event_id && eventsMap[assignment.event_id]) {
            assignment.events = eventsMap[assignment.event_id];
          }
        });
      }
    }
  }

  // 트럭 어싸인먼트(드라이버)
  const { data: truckAssignments, error: truckError } = await supabase
    .from("truck_assignment")
    .select(`*, trucks(*), employees(*)`)
    .eq("driver_id", employeeId)
    .gte("start_time", startOfDayUTC.toISOString())
    .lte("start_time", endOfDayUTC.toISOString());

  // 이벤트 정보를 별도로 가져오기
  if (truckAssignments && truckAssignments.length > 0) {
    const eventIds = truckAssignments
      .map((assignment) => assignment.event_id)
      .filter(Boolean);

    if (eventIds.length > 0) {
      // 먼저 events 테이블이 존재하는지 확인

      const { data: events, error: eventsError } = await supabase
        .from("event_basic_info_view")
        .select("*")
        .in("id", eventIds);

      if (!eventsError && events) {
        // 주소 정보를 가져오기 위한 address_id 목록
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
            // 이벤트에 주소 정보 추가
            acc[event.id] = {
              ...event,
              address: event.address_id ? addressesMap[event.address_id] : null,
            };
            return acc;
          },
          {} as Record<string, Address>
        );

        // 트럭 어싸인먼트에 이벤트 정보 추가
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

// 체크인/아웃 기록 가져오기 (타입별)
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

// 체크인
export async function checkin(assignmentId: string, type: "server" | "truck") {
  const supabase = createClient();
  const now = new Date().toISOString();

  // 이미 체크인된 row가 있는지 확인
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
    // 이미 체크인된 경우, 기존 데이터 반환
    return existing;
  }

  // 없으면 insert
  if (type === "truck") {
    const { data, error } = await supabase
      .from("truck_assignment_checkin")
      .insert({ assignment_id: assignmentId, clock_in_at: now })
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("server_assignment_clockin")
      .insert({ assignment_id: assignmentId, clock_in_at: now })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// 체크아웃
export async function checkout(assignmentId: string, type: "server" | "truck") {
  const supabase = createClient();
  const now = new Date().toISOString();
  if (type === "truck") {
    const { data, error } = await supabase
      .from("truck_assignment_checkin")
      .update({ clock_out_at: now })
      .eq("assignment_id", assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("server_assignment_clockin")
      .update({ clock_out_at: now })
      .eq("assignment_id", assignmentId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
