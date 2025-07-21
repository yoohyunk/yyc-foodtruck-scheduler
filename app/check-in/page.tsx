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

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  // UTC 시/분 추출 후 -6시간
  let hours = d.getUTCHours() - 6;
  if (hours < 0) hours += 24;
  const minutes = d.getUTCMinutes();
  // 12시간제 변환
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = ((hours + 11) % 12) + 1; // 0→12, 13→1
  return (
    displayHour.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    " " +
    ampm
  );
}

function getAssignmentStatus(assignment: Assignment, checkinData: CheckinData) {
  // Always use UTC for all comparisons
  const now = new Date();
  const nowUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    )
  );
  const start = new Date(assignment.start_date || assignment.start_time || 0);
  const end = new Date(assignment.end_date || assignment.end_time || 0);
  const checkinStart = new Date(start.getTime() - 4 * 60 * 60 * 1000);
  const checkinEnd = new Date(start.getTime() + 1 * 60 * 60 * 1000);
  const overtimeEnd = new Date(end.getTime() + 4 * 60 * 60 * 1000);

  if (checkinData?.clock_out_at) return "checked_out";
  if (checkinData?.clock_in_at && !checkinData?.clock_out_at) {
    if (nowUTC > end && nowUTC <= overtimeEnd) return "overtime";
    if (nowUTC > overtimeEnd) return "overtime_expired";
    if (nowUTC > end) return "overtime";
    return "checked_in";
  }
  if (nowUTC < checkinStart) return "before";
  if (nowUTC >= checkinStart && nowUTC <= checkinEnd) return "ready";
  if (nowUTC > checkinEnd) return "missed";
  return "ready";
}

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

  // 오늘 내 assignments 불러오기
  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    getTodayAssignmentsForEmployee(employeeId)
      .then(({ serverAssignments, truckAssignments }) => {
        setServerAssignments(serverAssignments);
        setTruckAssignments(truckAssignments);
        // 체크인 기록도 미리 불러오기
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

  // 실시간 시간 업데이트 (1분마다)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 가장 최근/진행 중/다음 assignment 찾기
  const allAssignments: Assignment[] = [
    ...serverAssignments.map((a) => ({ ...a, type: "server" as const })),
    ...truckAssignments.map((a) => ({ ...a, type: "truck" as const })),
  ];
  allAssignments.sort((a, b) => {
    const aStart = new Date(a.start_date || a.start_time || 0).getTime();
    const bStart = new Date(b.start_date || b.start_time || 0).getTime();
    return aStart - bStart;
  });
  const now = new Date();
  let mainAssignment: Assignment | null = null;
  for (const a of allAssignments) {
    const start = new Date(a.start_date || a.start_time || 0);
    const end = new Date(a.end_date || a.end_time || 0);
    if (now >= start && now <= end) {
      mainAssignment = a;
      break;
    }
  }
  if (!mainAssignment) {
    mainAssignment =
      allAssignments.find(
        (a) => new Date(a.start_date || a.start_time || 0) > now
      ) || allAssignments[allAssignments.length - 1];
  }

  // 체크인/아웃 핸들러
  const handleCheckin = useCallback(async (assignment: Assignment) => {
    setLoading(true);
    try {
      await checkin(assignment.id, assignment.type);
      // 새로고침
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

  if (!employeeId) return <div className="p-8">로그인이 필요합니다.</div>;
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (allAssignments.length === 0)
    return <div className="p-8">오늘 할당된 일정이 없습니다.</div>;

  // 남은 시간 계산 함수
  function getTimeRemaining(targetDate: Date): string {
    const diff = targetDate.getTime() - currentTime.getTime();

    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const minutes = Math.floor(
      (Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours.toString().padStart(2, "0")}hr ${minutes.toString().padStart(2, "0")}min`;
  }

  // 메시지 생성
  function getStatusMessage(status: string, assignment: Assignment) {
    const start = new Date(assignment.start_date || assignment.start_time || 0);
    const end = new Date(assignment.end_date || assignment.end_time || 0);

    if (status === "before") {
      const timeToStart = getTimeRemaining(start);
      return `Shift starts in ${timeToStart}`;
    }
    if (status === "missed")
      return `Check-in time expired (${formatTime(assignment.start_date || assignment.start_time)} - ${formatTime(assignment.end_date || assignment.end_time)})`;
    if (status === "checked_in") {
      const timeToEnd = getTimeRemaining(end);
      const diff = end.getTime() - currentTime.getTime();
      if (diff <= 0) {
        return `Shift ended - Check-out required`;
      }
      return `Shift ends in ${timeToEnd}`;
    }
    if (status === "checked_out")
      return `Check-out completed (${formatTime(assignment.clock_in_at)} - ${formatTime(assignment.clock_out_at)})`;
    if (status === "overtime") {
      const timeToEnd = getTimeRemaining(end);
      return `Overtime - Check-out required (${timeToEnd} ago)`;
    }
    if (status === "overtime_expired") {
      return `Overtime window expired (contact admin)`;
    }
    if (status === "ready") {
      const timeToEnd = getTimeRemaining(end);
      return `Shift ends in ${timeToEnd}`;
    }
    return "";
  }

  // 메인 어싸인먼트 강조
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
          assignments={allAssignments}
          getStatusMessage={getStatusMessage}
          getAssignmentStatus={getAssignmentStatus}
          checkinMap={checkinMap}
        />
      </div>
    </div>
  );
}
