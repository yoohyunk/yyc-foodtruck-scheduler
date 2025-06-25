import React from "react";
import { Employee } from "@/app/types";
import { useRouter } from "next/navigation";

interface ServerAssignment {
  id: string;
  employee_id: string;
  event_id: string;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  status: string;
  employees: Employee;
}

interface ServerAssignmentsSectionProps {
  serverAssignments: ServerAssignment[];
}

export default function ServerAssignmentsSection({
  serverAssignments,
}: ServerAssignmentsSectionProps) {
  const router = useRouter();

  const handleServerClick = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };

  if (serverAssignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Server Assignments
        </h3>
        <p className="text-gray-500">No servers assigned to this event yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Server Assignments ({serverAssignments.length})
      </h3>
      <div className="space-y-3">
        {serverAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => handleServerClick(assignment.employee_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {assignment.employees.first_name?.charAt(0) || ""}
                    {assignment.employees.last_name?.charAt(0) || ""}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {assignment.employees.first_name || ""}{" "}
                    {assignment.employees.last_name || ""}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {assignment.employees.user_phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.status === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : assignment.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : assignment.status === "Canceled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {assignment.status || "Pending"}
                </span>
                {assignment.is_completed && (
                  <span className="text-green-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Start:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(assignment.start_date).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">End:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(assignment.end_date).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
