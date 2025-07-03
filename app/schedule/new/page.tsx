"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/contexts/AuthContext";

export default function NewShiftPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Tables<'employees'>[]>([]);
  const [events, setEvents] = useState<Tables<'events'>[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [eventId, setEventId] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: employeesData, error: eErr } = await supabase
          .from("employees")
          .select("*");
        if (eErr) throw eErr;
        setEmployees(employeesData || []);
        const { data: eventsData, error: evErr } = await supabase
          .from("events")
          .select("*");
        if (evErr) throw evErr;
        setEvents(eventsData || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center text-red-600 font-bold">
        You do not have permission to view this page.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!employeeId || !date || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      const startDateTime = new Date(date);
      const [startHour, startMinute] = startTime.split(":");
      startDateTime.setHours(Number(startHour), Number(startMinute), 0, 0);
      const endDateTime = new Date(date);
      const [endHour, endMinute] = endTime.split(":");
      endDateTime.setHours(Number(endHour), Number(endMinute), 0, 0);
      const { error: insertErr } = await supabase.from("assignments").insert({
        employee_id: employeeId,
        event_id: eventId || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        is_completed: false,
        status: "Accepted",
      });
      if (insertErr) throw insertErr;
      setSuccess("Shift created successfully!");
      setEmployeeId("");
      setEventId("");
      setDate(new Date());
      setStartTime("");
      setEndTime("");
    } catch (err: any) {
      setError(err.message || "Failed to create shift");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Shift</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block mb-1 font-medium">Employee<span className="text-red-500">*</span></label>
          <select
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">Select employee</option>
            {employees.map(emp => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Date<span className="text-red-500">*</span></label>
          <DatePicker
            selected={date}
            onChange={d => setDate(d)}
            dateFormat="yyyy-MM-dd"
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Start Time<span className="text-red-500">*</span></label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">End Time<span className="text-red-500">*</span></label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Event (optional)</label>
          <select
            value={eventId}
            onChange={e => setEventId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">No event</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Create Shift"}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </form>
    </div>
  );
} 