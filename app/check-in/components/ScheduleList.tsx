import React from "react";
import { Assignment, CheckinData } from "@/app/types";

interface ScheduleListProps {
  assignments: Assignment[];
  getStatusMessage: (status: string, assignment: Assignment) => string;
  getAssignmentStatus: (
    assignment: Assignment,
    checkinData: CheckinData
  ) => string;
  checkinMap: Record<string, CheckinData>;
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);

  // 임시 해결: 6시간 추가 (데이터베이스 시간이 잘못 저장된 경우)
  const adjustedDate = new Date(d.getTime() + 6 * 60 * 60 * 1000);

  // 브라우저의 자동 시간대 변환 사용
  return adjustedDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ScheduleList({
  assignments,
  getStatusMessage,
  getAssignmentStatus,
  checkinMap,
}: ScheduleListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 pt-7">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Today&apos;s Schedule
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {assignments.map((assignment) => {
          const checkinData = checkinMap[`${assignment.type}_${assignment.id}`];
          const status = getAssignmentStatus(assignment, checkinData);
          return (
            <div key={assignment.type + assignment.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {assignment.type === "server" ? "Server" : "Driver"} -{" "}
                    {assignment.events?.title || "-"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatTime(assignment.start_date || assignment.start_time)}{" "}
                    - {formatTime(assignment.end_date || assignment.end_time)}
                  </p>
                  {assignment.type === "truck" && assignment.trucks?.name && (
                    <p className="text-sm text-gray-600">
                      🚛 {assignment.trucks.name}
                    </p>
                  )}
                  {assignment.events?.address && (
                    <p className="text-sm text-gray-500 mt-1">
                      📍{" "}
                      {assignment.events.address.street &&
                        `${assignment.events.address.street}, `}
                      {assignment.events.address.city &&
                        `${assignment.events.address.city}, `}
                      {assignment.events.address.province &&
                        `${assignment.events.address.province} `}
                      {assignment.events.address.postal_code &&
                        `${assignment.events.address.postal_code}`}
                      {assignment.events.address.country &&
                        `, ${assignment.events.address.country}`}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === "checked_in"
                      ? "bg-green-100 text-green-800"
                      : status === "checked_out"
                        ? "bg-gray-100 text-gray-800"
                        : status === "ready"
                          ? "bg-blue-100 text-blue-800"
                          : status === "overtime"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                  }`}
                >
                  {status === "checked_in"
                    ? "Checked In"
                    : status === "checked_out"
                      ? "Checked Out"
                      : status === "ready"
                        ? "Ready"
                        : status === "overtime"
                          ? "Overtime"
                          : "Pending"}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                {getStatusMessage(status, assignment)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
