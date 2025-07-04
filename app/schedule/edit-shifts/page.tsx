"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/contexts/AuthContext";

export default function EditShiftsPage() {
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<Tables<"assignments">[]>([]);
  const [employees, setEmployees] = useState<Tables<"employees">[]>([]);
  const [events, setEvents] = useState<Tables<"events">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Tables<"assignments">>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get all assignments for the selected date
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        const { data: assignmentsData, error: aErr } = await supabase
          .from("assignments")
          .select("*, employees(*), events(*)")
          .gte("start_date", start.toISOString())
          .lte("end_date", end.toISOString());
        if (aErr) throw aErr;
        setAssignments(assignmentsData || []);
        // Get all employees
        const { data: employeesData, error: eErr } = await supabase
          .from("employees")
          .select("*");
        if (eErr) throw eErr;
        setEmployees(employeesData || []);
        // Get all events (for event name lookup)
        const { data: eventsData, error: evErr } = await supabase
          .from("events")
          .select("*");
        if (evErr) throw evErr;
        setEvents(eventsData || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedDate, isAdmin, supabase]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-red-600 font-bold">
        You do not have permission to view this page.
      </div>
    );
  }

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditData({
      ...assignments[idx],
      start_date: assignments[idx].start_date?.slice(0, 16),
      end_date: assignments[idx].end_date?.slice(0, 16),
    });
  };

  const handleCancel = () => {
    setEditIdx(null);
    setEditData({});
    setError(null);
    setSuccess(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      const { id, start_date, end_date, employee_id } = editData;
      const { error: updateErr } = await supabase
        .from("assignments")
        .update({ start_date, end_date, employee_id })
        .eq("id", id);
      if (updateErr) throw updateErr;
      setSuccess("Shift updated successfully");
      // Refresh data
      setEditIdx(null);
      setEditData({});
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("*, employees(*), events(*)")
        .gte("start_date", start.toISOString())
        .lte("end_date", end.toISOString());
      setAssignments(assignmentsData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update shift");
    }
  };

  const getEventTitle = (event_id: string | null) => {
    if (!event_id) return "-";
    const event = events.find((ev) => ev.id === event_id);
    return event ? event.title : "-";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Shifts by Date</h1>
      <div className="mb-6">
        <label className="block mb-2 font-medium">Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            if (date) setSelectedDate(date);
          }}
          dateFormat="yyyy-MM-dd"
          className="border rounded px-3 py-2"
        />
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600 mb-4">{error}</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Event</th>
              <th className="p-2 border">Start Time</th>
              <th className="p-2 border">End Time</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-4">
                  No shifts for this date.
                </td>
              </tr>
            ) : (
              assignments.map((a, idx) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2 border">
                    {editIdx === idx ? (
                      <select
                        name="employee_id"
                        value={editData.employee_id || ""}
                        onChange={handleChange}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.first_name} {emp.last_name}
                          </option>
                        ))}
                      </select>
                    ) : // @ts-expect-error: employees is present due to join in select
                    a.employees?.first_name ? (
                      // @ts-expect-error: employees is present due to join in select
                      `${a.employees.first_name} ${a.employees.last_name}`
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td className="p-2 border">{getEventTitle(a.event_id)}</td>
                  <td className="p-2 border">
                    {editIdx === idx ? (
                      <input
                        type="datetime-local"
                        name="start_date"
                        value={editData.start_date}
                        onChange={handleChange}
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      new Date(a.start_date).toLocaleString()
                    )}
                  </td>
                  <td className="p-2 border">
                    {editIdx === idx ? (
                      <input
                        type="datetime-local"
                        name="end_date"
                        value={editData.end_date}
                        onChange={handleChange}
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      new Date(a.end_date).toLocaleString()
                    )}
                  </td>
                  <td className="p-2 border">
                    {editIdx === idx ? (
                      <>
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                          onClick={handleSave}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => handleEdit(idx)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {success && <div className="text-green-600 mt-4">{success}</div>}
    </div>
  );
}
