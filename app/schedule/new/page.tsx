"use client";

import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EmployeeSelectionModalForAssignment from "./EmployeeSelectionModalForAssignment";
import ErrorModal from "@/app/components/ErrorModal";
import { eventsApi } from "@/lib/supabase/events";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { Tables } from "@/database.types";
import { useAuth } from "@/contexts/AuthContext";

// Types from DB
type Employee = Tables<"employees">;
type Event = Tables<"events">;

const AddAssignmentPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  // Assignment form state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Employee and event selection state
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventsInRange, setEventsInRange] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Error handling
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Remove unused error variable and use ErrorModal for error display in all catch blocks
  // (No useEffect here as event loading is now handled on button click)

  // Validation
  const validate = (): boolean => {
    if (!startDate || !endDate || !startTime || !endTime) {
      setError("All date and time fields are required.");
      setShowErrorModal(true);
      return false;
    }
    if (!selectedEmployees.length) {
      setError("Please select at least one employee.");
      setShowErrorModal(true);
      return false;
    }
    if (!selectedEvent) {
      setError("Please select an event.");
      setShowErrorModal(true);
      return false;
    }
    // Start must be before end
    const start = new Date(startDate);
    start.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const end = new Date(endDate);
    end.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    if (start >= end) {
      setError("End time must be after start time.");
      setShowErrorModal(true);
      return false;
    }
    return true;
  };

  // Save assignment
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const start = new Date(startDate!);
      start.setHours(startTime!.getHours(), startTime!.getMinutes(), 0, 0);
      const end = new Date(endDate!);
      end.setHours(endTime!.getHours(), endTime!.getMinutes(), 0, 0);

      // Use createServerAssignments for all selected employees
      await assignmentsApi.createServerAssignments(
        selectedEvent!.id,
        selectedEmployees.map((emp) => emp.employee_id),
        start.toISOString().split("T")[0],
        start.toTimeString().slice(0, 5),
        end.toISOString().split("T")[0],
        end.toTimeString().slice(0, 5)
      );
      handleCancel();
    } catch {
      setError("Failed to save assignment.");
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel/clear form
  const handleCancel = () => {
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    setSelectedEmployees([]);
    setSelectedEvent(null);
    setEmployeeModalOpen(false);
    setEventModalOpen(false);
    setError(null);
    setShowErrorModal(false);
  };

  // Event selection modal (simple, styled)
  const EventSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    events: Event[];
    onSelect: (event: Event) => void;
  }> = ({ isOpen, onClose, events, onSelect }) =>
    !isOpen ? null : (
      <div className="modal-overlay">
        <div
          className="modal-container"
          style={{ maxWidth: 500, width: "90%", position: "relative" }}
        >
          <div className="modal-header">
            <h3
              className="modal-title"
              style={{ width: "100%", textAlign: "center" }}
            >
              Select Event
            </h3>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              ×
            </button>
          </div>
          <div
            className="modal-body"
            style={{ maxHeight: 320, overflowY: "auto", marginBottom: 0 }}
          >
            {events.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                No events found in this date range.
              </div>
            )}
            {events.map((event) => (
              <button
                key={event.id}
                className="event-card bg-white p-4 rounded shadow relative w-full text-left mb-3 border border-gray-200 hover:bg-blue-50 transition"
                onClick={() => {
                  onSelect(event);
                  onClose();
                }}
                type="button"
              >
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p>
                  <strong>Date:</strong>{" "}
                  {event.start_date && event.end_date
                    ? `${event.start_date.split("T")[0]} - ${event.end_date.split("T")[0]}`
                    : "Date not set"}
                </p>
                <p>
                  <strong>Time:</strong>{" "}
                  {event.start_date && event.end_date
                    ? `${new Date(event.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(event.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "Time not set"}
                </p>
                <p>
                  <strong>Location:</strong>{" "}
                  {event.description || "Location not set"}
                </p>
                <p>
                  <strong>Required Servers:</strong>{" "}
                  {event.number_of_servers_needed || 0}
                </p>
                <p>
                  <strong>Required Drivers:</strong>{" "}
                  {event.number_of_driver_needed || 0}
                </p>
                {event.contact_name && (
                  <p>
                    <strong>Contact:</strong> {event.contact_name}
                  </p>
                )}
                <p>
                  <strong>Payment:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      event.is_prepaid
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {event.is_prepaid ? "Prepaid" : "Pending"}
                  </span>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      event.status === "Pending"
                        ? "text-yellow-500"
                        : event.status === "Cancelled"
                          ? "text-red-500"
                          : "text-green-500"
                    }
                  >
                    {event.status || "Pending"}
                  </span>
                </p>
              </button>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  const loadEventsForModal = async () => {
    if (!startDate) return;
    try {
      // Fetch events based on user role
      let allEvents: Event[];
      if (isAdmin) {
        // Admin: load all events
        allEvents = await eventsApi.getAllEvents();
      } else if (user) {
        // Employee: load only assigned events
        const response = await fetch(`/api/events/assigned?userId=${user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch assigned events");
        }
        const result = await response.json();
        allEvents = result.events || [];
      } else {
        allEvents = [];
      }
      function toUTCDateString(date: Date | string) {
        const d = new Date(date);
        return (
          d.getUTCFullYear() +
          "-" +
          String(d.getUTCMonth() + 1).padStart(2, "0") +
          "-" +
          String(d.getUTCDate()).padStart(2, "0")
        );
      }
      const startDay = new Date(startDate);
      const prevDay = new Date(startDay);
      prevDay.setUTCDate(startDay.getUTCDate() - 1);
      const nextDay = new Date(startDay);
      nextDay.setUTCDate(startDay.getUTCDate() + 1);
      const validDays = [
        toUTCDateString(prevDay),
        toUTCDateString(startDay),
        toUTCDateString(nextDay),
      ];
      const filtered = allEvents.filter((event) => {
        if (!event.start_date) return false;
        const eventStart = toUTCDateString(event.start_date);
        return validDays.includes(eventStart);
      });
      filtered.sort((a, b) => {
        const dateA = new Date(a.start_date || "").getTime();
        const dateB = new Date(b.start_date || "").getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.title || "").localeCompare(b.title || "");
      });
      setEventsInRange(filtered);
    } catch {
      setError("Failed to load events.");
      setShowErrorModal(true);
    }
  };

  return (
    <div
      className="form-section"
      style={{ maxWidth: 520, margin: "2rem auto" }}
    >
      <h2 className="form-section-title text-center mb-6">Add Assignment</h2>
      {/* Date and Time Pickers */}
      <div className="form-grid-2 mb-6">
        <div className="form-field">
          <label className="form-label">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setStartDate(date);
              if (date && !endDate) {
                setEndDate(date);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="form-input"
            placeholderText="Select start date"
          />
        </div>
        <div className="form-field">
          <label className="form-label">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            dateFormat="yyyy-MM-dd"
            minDate={startDate || new Date()}
            className="form-input"
            placeholderText="Select end date"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Start Time</label>
          <DatePicker
            selected={startTime}
            onChange={setStartTime}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            className="form-input"
            placeholderText="Select time"
            openToDate={new Date()}
            minTime={new Date(0, 0, 0, 0, 0, 0)}
            maxTime={new Date(0, 0, 0, 23, 59, 59)}
          />
        </div>
        <div className="form-field">
          <label className="form-label">End Time</label>
          <DatePicker
            selected={endTime}
            onChange={setEndTime}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="End Time"
            dateFormat="h:mm aa"
            className="form-input"
            placeholderText="Select end time"
            openToDate={new Date()}
            minTime={new Date(0, 0, 0, 0, 0, 0)}
            maxTime={new Date(0, 0, 0, 23, 59, 59)}
          />
        </div>
      </div>
      {/* Event Selection */}
      <div className="form-field mb-6">
        <button
          type="button"
          className="btn btn-primary mb-2"
          onClick={async () => {
            await loadEventsForModal();
            setEventModalOpen(true);
          }}
          disabled={!startDate || !endDate}
        >
          Select Event
        </button>
        {selectedEvent && (
          <div className="mt-2 text-sm text-blue-700">
            <span className="font-semibold">Selected Event:</span>{" "}
            {selectedEvent.title}
          </div>
        )}
      </div>
      {/* Employee Selection */}
      <div className="form-field mb-6">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setEmployeeModalOpen(true)}
          disabled={!startDate || !endDate || !startTime || !endTime}
        >
          Select Employees
        </button>
        {(!startDate || !endDate || !startTime || !endTime) && (
          <div className="validation-message error mt-2">
            Please select start and end date and time first.
          </div>
        )}
        {selectedEmployees.length > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            <span className="font-semibold">Selected:</span>{" "}
            {selectedEmployees
              .map((e) => [e.first_name, e.last_name].filter(Boolean).join(" "))
              .join(", ")}
          </div>
        )}
      </div>
      {/* Save/Cancel Buttons */}
      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errors={error ? [{ field: "form", message: error }] : []}
          title="Error"
        />
      )}
      {/* Employee Selection Modal */}
      {employeeModalOpen && startDate && endDate && startTime && endTime && (
        <EmployeeSelectionModalForAssignment
          isOpen={employeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          assignmentStart={(() => {
            const d = new Date(startDate);
            d.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
            return d.toISOString();
          })()}
          assignmentEnd={(() => {
            const d = new Date(endDate);
            d.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
            return d.toISOString();
          })()}
        />
      )}
      {/* Event Selection Modal */}
      {eventModalOpen && (
        <EventSelectionModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          events={eventsInRange}
          onSelect={(event) => {
            setSelectedEvent(event);
            setEventModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AddAssignmentPage;
