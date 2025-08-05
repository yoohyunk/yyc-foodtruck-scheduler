import React from "react";
import { Employee } from "@/app/types";
import { useRouter } from "next/navigation";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { useState } from "react";
import ErrorModal from "../../../components/ErrorModal";
import EditAssignmentModal from "./EditAssignmentModal";
import { extractTime, extractDate } from "../../utils";

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
  onAssignmentRemoved?: () => void;
  isAdmin?: boolean;
}

export default function ServerAssignmentsSection({
  serverAssignments,
  onAssignmentRemoved,
  isAdmin = false,
}: ServerAssignmentsSectionProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<{
    id: string;
    eventId: string;
    employeeName: string;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [assignmentToEdit, setAssignmentToEdit] =
    useState<ServerAssignment | null>(null);

  const handleServerClick = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };

  const handleRemoveAssignment = async (
    assignmentId: string,
    eventId: string
  ) => {
    setRemovingId(assignmentId);
    try {
      await assignmentsApi.removeServerAssignment(assignmentId, eventId);
      // Call the callback to refresh server assignments instead of refreshing the page
      if (onAssignmentRemoved) {
        onAssignmentRemoved();
      }
    } catch (err) {
      console.error("Failed to unassign employee:", err);
      alert("Failed to unassign employee.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUnassignClick = (assignment: ServerAssignment) => {
    const employeeName =
      `${assignment.employees.first_name || ""} ${assignment.employees.last_name || ""}`.trim();
    setAssignmentToRemove({
      id: assignment.id,
      eventId: assignment.event_id,
      employeeName: employeeName || "this employee",
    });
    setShowConfirmModal(true);
  };

  const handleConfirmUnassign = async () => {
    if (!assignmentToRemove) return;

    await handleRemoveAssignment(
      assignmentToRemove.id,
      assignmentToRemove.eventId
    );
    setShowConfirmModal(false);
    setAssignmentToRemove(null);
  };

  const handleCancelUnassign = () => {
    setShowConfirmModal(false);
    setAssignmentToRemove(null);
  };

  const handleEditClick = (assignment: ServerAssignment) => {
    setAssignmentToEdit(assignment);
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setAssignmentToEdit(null);
  };

  const handleAssignmentUpdated = () => {
    if (onAssignmentRemoved) {
      onAssignmentRemoved();
    }
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
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          Server Assignments ({serverAssignments.length})
        </h3>
        <div className="space-y-3">
          {serverAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className={`border border-gray-200 rounded-lg p-4 bg-gray-50 transition-colors${isAdmin ? " hover:bg-gray-100 cursor-pointer" : ""}`}
              onClick={
                isAdmin
                  ? () => handleServerClick(assignment.employee_id)
                  : undefined
              }
              style={!isAdmin ? { pointerEvents: "none", opacity: 0.8 } : {}}
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
                  <div className="flex flex-col space-y-1">
                    {isAdmin && (
                      <>
                        <button
                          className="p-1 rounded hover:bg-red-100 text-red-600 flex items-center justify-center transition-all duration-200 hover:scale-110"
                          title="Unassign"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnassignClick(assignment);
                          }}
                          disabled={removingId === assignment.id}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                        <button
                          className="p-1 rounded hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all duration-200 hover:scale-110"
                          title="Edit Times"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(assignment);
                          }}
                        >
                          ✏️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-900">
                      {extractDate(assignment.start_date, assignment.end_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time:</span>
                    <span className="ml-2 text-gray-900">
                      {extractTime(assignment.start_date)} -{" "}
                      {extractTime(assignment.end_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ErrorModal
        isOpen={showConfirmModal}
        onClose={handleCancelUnassign}
        errors={[
          {
            field: "confirmation",
            message: `Are you sure you want to unassign ${assignmentToRemove?.employeeName} from this event?`,
            element: null,
          },
        ]}
        title="Confirm Unassign"
        type="confirmation"
        onConfirm={handleConfirmUnassign}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        assignment={assignmentToEdit}
        onAssignmentUpdated={handleAssignmentUpdated}
      />
    </>
  );
}
