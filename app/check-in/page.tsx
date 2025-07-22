"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  getTodayAssignmentsForEmployee,
  getCheckinRecord,
  checkin,
  checkout,
} from "@/lib/supabase/checkin";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import MainAssignmentCard from "./components/MainAssignmentCard";
import ScheduleList from "./components/ScheduleList";
import { Assignment, CheckinData } from "@/app/types";
import { extractTime } from "@/app/events/utils";
import { parseTime, getAssignmentStatus } from "./utils";

export default function CheckInPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverAssignments, setServerAssignments] = useState<Assignment[]>([]);
  const [truckAssignments, setTruckAssignments] = useState<Assignment[]>([]);
  const [checkinMap, setCheckinMap] = useState<Record<string, CheckinData>>({});
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get employee_id from user
  useEffect(() => {
    if (!user?.id) return;

    const getEmployeeId = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setEmployeeId(data.employee_id);
      }
    };

    getEmployeeId();
  }, [user?.id]);

  // Get today's assignments
  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    getTodayAssignmentsForEmployee(employeeId)
      .then(({ serverAssignments, truckAssignments }) => {
        setServerAssignments(serverAssignments);
        setTruckAssignments(truckAssignments);
        // Get checkin records for all assignments
        const all = [
          ...serverAssignments.map((a) => ({
            id: a.id,
            type: "server" as const,
          })),
          ...truckAssignments.map((a) => ({
            id: a.id,
            type: "truck" as const,
          })),
        ];
        return Promise.all(
          all.map((a) =>
            getCheckinRecord(a.id, a.type).then((data) => ({
              id: a.id,
              type: a.type,
              data,
            }))
          )
        );
      })
      .then((results) => {
        const map: Record<string, CheckinData> = {};
        results.forEach((r) => {
          map[`${r.type}_${r.id}`] = r.data;
        });
        setCheckinMap(map);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load assignments");
        setLoading(false);
      });
  }, [employeeId]);

  // Update current time (every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Prepare all assignments
  const allAssignments: Assignment[] = [
    ...serverAssignments.map((a) => ({ ...a, type: "server" as const })),
    ...truckAssignments.map((a) => ({ ...a, type: "truck" as const })),
  ];
  allAssignments.sort((a, b) => {
    const aStart = new Date(a.start_date || a.start_time || 0).getTime();
    const bStart = new Date(b.start_date || b.start_time || 0).getTime();
    return aStart - bStart;
  });

  // Filter for today's assignments only
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const todaysAssignments = allAssignments.filter((assignment) => {
    const assignmentDate = new Date(
      assignment.start_date || assignment.start_time || 0
    );
    return assignmentDate >= todayStart && assignmentDate < todayEnd;
  });

  // Find the most recent/current/next assignment from today's assignments
  const now = new Date();
  let mainAssignment: Assignment | null = null;

  // First, try to find a currently active assignment
  for (const a of todaysAssignments) {
    const start = new Date(a.start_date || a.start_time || 0);
    const end = new Date(a.end_date || a.end_time || 0);
    if (now >= start && now <= end) {
      mainAssignment = a;
      break;
    }
  }

  // If no active assignment, find the next upcoming one
  if (!mainAssignment) {
    mainAssignment =
      todaysAssignments.find(
        (a) => new Date(a.start_date || a.start_time || 0) > now
      ) || todaysAssignments[todaysAssignments.length - 1];
  }

  // Checkin/checkout handlers
  const handleCheckin = useCallback(async (assignment: Assignment) => {
    setLoading(true);
    try {
      await checkin(assignment.id, assignment.type);
      // Refresh checkin records
      const data = await getCheckinRecord(assignment.id, assignment.type);
      setCheckinMap((prev) => ({
        ...prev,
        [`${assignment.type}_${assignment.id}`]: data,
      }));
    } catch {
      setError("Check-in failed");
    }
    setLoading(false);
  }, []);
  const handleCheckout = useCallback(async (assignment: Assignment) => {
    setLoading(true);
    try {
      await checkout(assignment.id, assignment.type);
      const data = await getCheckinRecord(assignment.id, assignment.type);
      setCheckinMap((prev) => ({
        ...prev,
        [`${assignment.type}_${assignment.id}`]: data,
      }));
    } catch {
      setError("Check-out failed");
    }
    setLoading(false);
  }, []);

  if (!employeeId) return <div className="p-8">login required</div>;
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  if (todaysAssignments.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Today&apos;s Check-in
        </h1>
        <div className="event-log-card">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🍋</div>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
            >
              No events today
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#6b7280" }}>
              Have a great day off!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate remaining time
  function getTimeRemaining(targetDate: Date): string {
    const diff = targetDate.getTime() - currentTime.getTime();

    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const minutes = Math.floor(
      (Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours.toString().padStart(2, "0")}hr ${minutes.toString().padStart(2, "0")}min`;
  }

  // Generate status message
  function getStatusMessage(status: string, assignment: Assignment) {
    const end = parseTime(assignment.end_date || assignment.end_time);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setHours(end.hours, end.minutes, 0, 0);

    if (status === "before") {
      const timeToStart = getTimeRemaining(
        new Date(assignment.start_date || assignment.start_time || 0)
      );
      return `Shift starts in ${timeToStart}`;
    }
    if (status === "missed")
      return `Check-in not active (${extractTime(assignment.start_date || assignment.start_time || "")} - ${extractTime(assignment.end_date || assignment.end_time || "")})`;
    if (status === "checked_in") {
      const timeToEnd = getTimeRemaining(endDate);
      const diff = endDate.getTime() - currentTime.getTime();
      console.log("[getStatusMessage]", {
        now: currentTime.toISOString(),
        end: endDate.toISOString(),
        diff,
      });
      if (diff <= 0) {
        return `Shift ended - Check-out required`;
      }
      return `Shift ends in ${timeToEnd}`;
    }
    if (status === "checked_out")
      return `Check-out completed (${extractTime(checkinMap[`${assignment.type}_${assignment.id}`]?.clock_in_at || "")} - ${extractTime(checkinMap[`${assignment.type}_${assignment.id}`]?.clock_out_at || "")})`;
    if (status === "overtime") {
      const timeToEnd = getTimeRemaining(endDate);
      return `Overtime - Check-out required (${timeToEnd} ago)`;
    }
    if (status === "overtime_expired") {
      return `Overtime window expired (contact admin)`;
    }
    if (status === "ready") {
      const timeToEnd = getTimeRemaining(endDate);
      return `Shift ends in ${timeToEnd}`;
    }
    return "";
  }

  // Highlight main assignment
  const mainCheckin = checkinMap[`${mainAssignment.type}_${mainAssignment.id}`];
  const mainStatus = getAssignmentStatus(mainAssignment, mainCheckin);

  return (
    <div
      className="max-w-5xl mx-auto px-4"
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
      }}
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Today&apos;s Check-in
      </h1>
      <div className="event-log-card">
        <MainAssignmentCard
          assignment={mainAssignment}
          status={mainStatus}
          statusMessage={getStatusMessage(mainStatus, mainAssignment)}
          onCheckin={handleCheckin}
          onCheckout={handleCheckout}
          loading={loading}
        />
      </div>
      <div className="event-log-list" style={{ marginTop: "2rem" }}>
        <ScheduleList
          assignments={todaysAssignments}
          getStatusMessage={getStatusMessage}
          getAssignmentStatus={getAssignmentStatus}
          checkinMap={checkinMap}
        />
      </div>
    </div>
  );
}
