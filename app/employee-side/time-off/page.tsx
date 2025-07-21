"use client";
import React, { useState, useEffect } from "react";
import { FiCalendar, FiClock, FiUser } from "react-icons/fi";
import { TimeOffRequest } from "../../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function TimeOffPage(): React.JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const supabase = createClient();

  // Fetch employee's time off requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (authLoading || !user?.id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get employee ID for current user
        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("employee_id")
          .eq("user_id", user.id)
          .single();

        if (employeeError || !employee) {
          setError("Employee information not found.");
          setRequests([]);
          return;
        }

        // Fetch time off requests for this employee
        const requestsData =
          await timeOffRequestsApi.getTimeOffRequestsByEmployeeId(
            employee.employee_id
          );
        setRequests(requestsData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load your time off requests.");
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user?.id, authLoading, supabase]);

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await timeOffRequestsApi.deleteTimeOffRequest(requestId);
      setRequests(requests.filter((request) => request.id !== requestId));
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request. Please try again.");
    }
  };

  // Helper to display local time as selected (no timezone conversion)
  function formatLocalDateTimeString(dateTimeString: string) {
    if (!dateTimeString) return "";
    const [date, time] = dateTimeString.split("T");
    if (!date || !time) return dateTimeString;
    const [hour, minute] = time.split(":");
    return `${date} ${hour}:${minute}`;
  }

  const formatDateOnly = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateDuration = (startDateTime: string, endDateTime: string) => {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffTime = Math.abs(end.getTime() - start.getTime());

    // Calculate days, hours, and minutes
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));

    // Format the duration string
    let duration = "";

    if (diffDays > 0) {
      duration += `${diffDays} day${diffDays > 1 ? "s" : ""}`;
      if (diffHours > 0) {
        duration += ` ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      }
    } else if (diffHours > 0) {
      duration += `${diffHours} hour${diffHours > 1 ? "s" : ""}`;
      if (diffMinutes > 0) {
        duration += ` ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
      }
    } else {
      duration += `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }

    return duration;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests =
    filterStatus === "All"
      ? requests
      : requests.filter((request) => request.status === filterStatus);

  // Sort requests by created_at date
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  if (authLoading) {
    return (
      <div className="my-time-off-requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          My Time-Off Requests
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-time-off-requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          My Time-Off Requests
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Please log in to view your time off requests.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="my-time-off-requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          My Time-Off Requests
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading your requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-time-off-requests-page">
        <h2 className="text-2xl text-primary-dark mb-4">
          My Time-Off Requests
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl text-primary-dark mb-4">My Time-Off Requests</h2>

      <Link
        href="/employee-side/time-off-request"
        className="button bg-primary-medium text-white hover:bg-primary-dark px-6 py-2 rounded font-semibold flex items-center gap-2 shadow"
      >
        <FiCalendar className="text-white" />
        Request Time Off
      </Link>

      {/* Filter Buttons */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          className={`button ${filterStatus === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("All")}
        >
          <div className="flex items-center justify-center">
            <FiCalendar
              className={`mr-2 ${filterStatus === "All" ? "text-white" : "text-blue-500"}`}
            />
            <span>All ({requests.length})</span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Pending" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Pending")}
        >
          <div className="flex items-center justify-center">
            <FiClock
              className={`mr-2 ${filterStatus === "Pending" ? "text-white" : "text-yellow-500"}`}
            />
            <span>
              Pending ({requests.filter((r) => r.status === "Pending").length})
            </span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Accepted" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Accepted")}
        >
          <div className="flex items-center justify-center">
            <FiUser
              className={`mr-2 ${filterStatus === "Accepted" ? "text-white" : "text-green-500"}`}
            />
            <span>
              Accepted ({requests.filter((r) => r.status === "Accepted").length}
              )
            </span>
          </div>
        </button>
        <button
          className={`button ${filterStatus === "Rejected" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setFilterStatus("Rejected")}
        >
          <div className="flex items-center justify-center">
            <FiUser
              className={`mr-2 ${filterStatus === "Rejected" ? "text-white" : "text-red-500"}`}
            />
            <span>
              Rejected ({requests.filter((r) => r.status === "Rejected").length}
              )
            </span>
          </div>
        </button>
      </div>

      {/* Sort Button */}
      <div className="flex justify-end mb-4">
        <button
          className="button bg-gray-200 text-primary-dark hover:bg-gray-300"
          onClick={() =>
            setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
          }
        >
          <div className="flex items-center">
            <span>
              Sort by:{" "}
              {sortOrder === "newest" ? "Newest First" : "Oldest First"}
            </span>
          </div>
        </button>
      </div>

      {/* Requests List */}
      <div className="grid gap-4">
        {sortedRequests.length > 0 ? (
          sortedRequests.map((request) => (
            <div
              key={request.id}
              className="employee-card bg-white p-6 rounded shadow relative"
            >
              {/* Header Row */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {request.type}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    {/* Reason Section */}
                    {request.reason && (
                      <div className="bg-gray-50 p-3 rounded-lg mt-3">
                        <div className="flex items-center mb-2">
                          <span className="font-medium text-gray-700">
                            Reason for Time Off:
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {request.reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete Button - Only show for Pending requests */}
                {request.status === "Pending" && (
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Delete request"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Date/Time Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiCalendar className="text-blue-500 mr-2" />
                    <span className="font-medium text-gray-700">
                      Start Date & Time
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatLocalDateTimeString(request.start_datetime)}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiCalendar className="text-blue-500 mr-2" />
                    <span className="font-medium text-gray-700">
                      End Date & Time
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatLocalDateTimeString(request.end_datetime)}
                  </span>
                </div>
              </div>

              {/* Duration Calculation */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Duration:{" "}
                    {calculateDuration(
                      request.start_datetime,
                      request.end_datetime
                    )}
                  </span>
                  <span>
                    Requested on: {formatDateOnly(request.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {filterStatus === "All"
              ? "You haven't submitted any time off requests yet."
              : `No ${filterStatus.toLowerCase()} time off requests found.`}
          </div>
        )}
      </div>
    </div>
  );
}
