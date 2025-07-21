import React from "react";
import { Assignment } from "@/app/types";

interface MainAssignmentCardProps {
  assignment: Assignment;
  status: string;
  statusMessage: string;
  onCheckin: (assignment: Assignment) => void;
  onCheckout: (assignment: Assignment) => void;
  loading: boolean;
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

export default function MainAssignmentCard({
  assignment,
  status,
  statusMessage,
  onCheckin,
  onCheckout,
  loading,
}: MainAssignmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md pt-20 mb-8 border border-gray-200 flex flex-col items-center justify-center">
      <div className="text-2xl font-semibold text-gray-900 text-center">
        {assignment.type === "server" ? "Server" : "Driver"} Check-in
      </div>

      <div className="flex items-center justify-center">
        <p className="text-gray-900 font-bold">
          {assignment.events?.title || "-"}:
        </p>
        <p className="text-gray-900">
          {formatTime(assignment.start_date || assignment.start_time)} -{" "}
          {formatTime(assignment.end_date || assignment.end_time)}
        </p>
      </div>
      {assignment.events?.address && (
        <div className="mb-6">
          <p className="text-gray-900">
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
        </div>
      )}

      {assignment.type === "truck" && assignment.trucks?.name && (
        <div className="mb-6">
          <p className="text-gray-900">{assignment.trucks.name}truck</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-gray-900">{statusMessage}</p>
      </div>

      <div className="flex gap-3 justify-end">
        {status === "ready" || status === "overtime" ? (
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onCheckin(assignment)}
            disabled={loading}
          >
            Check In
          </button>
        ) : null}
        {status === "checked_in" || status === "overtime" ? (
          <button
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onCheckout(assignment)}
            disabled={loading}
          >
            Check Out
          </button>
        ) : null}
      </div>
    </div>
  );
}
