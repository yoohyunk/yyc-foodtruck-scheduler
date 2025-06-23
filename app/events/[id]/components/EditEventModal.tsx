import React from "react";
import { EventFormData } from "@/app/types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: EventFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedDate: Date | null;
  selectedTime: Date | null;
  selectedEndTime: Date | null;
  isSubmitting: boolean;
  onDateChange: (date: Date | null) => void;
  onTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  setEditFormData: (data: EventFormData) => void;
}

export default function EditEventModal({
  isOpen,
  onClose,
  formData,
  onFormChange,
  selectedDate,
  selectedTime,
  selectedEndTime,
  isSubmitting,
  onDateChange,
  onTimeChange,
  onEndTimeChange,
  onSubmit,
  setEditFormData,
}: EditEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-2xl">
        <h3 className="modal-title">Edit Event</h3>
        <form onSubmit={onSubmit} className="modal-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <DatePicker
                selected={selectedDate}
                onChange={onDateChange}
                dateFormat="yyyy-MM-dd"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time *
              </label>
              <DatePicker
                selected={selectedTime}
                onChange={onTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time *
              </label>
              <DatePicker
                selected={selectedEndTime}
                onChange={onEndTimeChange}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select time"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Servers *
              </label>
              <input
                type="number"
                name="requiredServers"
                value={formData.requiredServers}
                onChange={onFormChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={onFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isPrepaid"
                  checked={formData.isPrepaid}
                  onChange={(e) =>
                    setEditFormData({
                      ...formData,
                      isPrepaid: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Prepaid
                </span>
              </label>
            </div>
          </div>
        </form>
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Event"}
          </button>
        </div>
      </div>
    </div>
  );
}
