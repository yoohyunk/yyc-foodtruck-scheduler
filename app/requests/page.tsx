"use client";
import { useState, FormEvent, ChangeEvent, ReactElement } from "react";
import { FiCalendar } from "react-icons/fi";

interface TimeOffRequest {
  date: string;
  type: string;
  duration: string;
  status: "Approved" | "Pending" | "Rejected";
  reason: string;
}

interface FormData {
  date: string;
  type: string;
  duration: string;
  reason: string;
}

export default function TimeOff(): ReactElement {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [requests, setRequests] = useState<TimeOffRequest[]>([
    {
      date: "2024-11-13",
      type: "Sick Leave",
      duration: "Full Day",
      status: "Approved",
      reason: "Flu",
    },
    {
      date: "2024-11-15",
      type: "Personal",
      duration: "Half Day (AM)",
      status: "Pending",
      reason: "Errand",
    },
  ]);

  const [formData, setFormData] = useState<FormData>({
    date: "",
    type: "Vacation",
    duration: "Full Day",
    reason: "",
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newRequest: TimeOffRequest = { ...formData, status: "Pending" };
    setRequests([...requests, newRequest]);
    setFormData({
      date: "",
      type: "Vacation",
      duration: "Full Day",
      reason: "",
    });
    setShowModal(false);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Time-Off Requests</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-gray-100 transition"
        >
          + Request Time-Off
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full  rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left text-sm text-gray-600">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Type</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item, index) => (
              <tr key={index} className="text-sm">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <FiCalendar size={16} />
                    <span className="inline-block">{item.date}</span>
                  </div>
                </td>
                <td className="p-3">{item.type}</td>
                <td className="p-3">{item.duration}</td>
                <td className="p-3">
                  <span
                    className={`badge ${
                      item.status === "Approved"
                        ? "bg-green-100 text-green-600"
                        : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="p-3">{item.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Form */}
      {showModal && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4">Request Time-Off</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                required
                className="w-full border p-2 rounded"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">
                Type of Leave
              </label>
              <select
                name="type"
                className="w-full border p-2 rounded"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option>Vacation</option>
                <option>Sick Leave</option>
                <option>Personal</option>
                <option>Emergency</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Duration</label>
              <select
                name="duration"
                className="w-full border p-2 rounded"
                value={formData.duration}
                onChange={handleInputChange}
              >
                <option>Full Day</option>
                <option>Half Day (AM)</option>
                <option>Half Day (PM)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Reason</label>
              <textarea
                name="reason"
                rows={3}
                className="w-full border p-2 rounded"
                placeholder="Optional"
                value={formData.reason}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-white text-black border border-black px-4 py-2 rounded hover:bg-gray-100 transition"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
