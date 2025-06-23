"use client";
import { useState, FormEvent, ChangeEvent, ReactElement } from "react";
import { FiCalendar } from "react-icons/fi";
import { TimeOffRequest, TimeOffRequestFormData } from "../types";

export default function TimeOff(): ReactElement {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    date: "",
    type: "Vacation",
    duration: "Full Day",
    reason: "",
  });

  const [startHour, setStartHour] = useState("09");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("05");
  const [endPeriod, setEndPeriod] = useState("PM");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const customDuration =
      formData.duration === "Full Day"
        ? "Full Day"
        : `${startHour}:00 ${startPeriod} - ${endHour}:00 ${endPeriod}`;

    const newRequest: TimeOffRequest = {
      ...formData,
      duration: customDuration,
      status: "Pending",
    };

    setRequests([...requests, newRequest]);

    setFormData({
      date: "",
      type: "Vacation",
      duration: "Full Day",
      reason: "",
    });

    setStartHour("09");
    setStartPeriod("AM");
    setEndHour("05");
    setEndPeriod("PM");

    setShowModal(false);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "reason" && value.length > 1000) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getTotalHours = () => {
    let start = parseInt(startHour);
    let end = parseInt(endHour);

    if (startPeriod === "PM" && start !== 12) start += 12;
    if (endPeriod === "PM" && end !== 12) end += 12;
    if (startPeriod === "AM" && start === 12) start = 0;
    if (endPeriod === "AM" && end === 12) end = 0;

    const diff = end - start;
    return diff > 0 ? diff : 0;
  };

  const hours = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const periods = ["AM", "PM"];

  return (
    <div className="max-w-5xl mx-auto p-6">
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
        <table className="w-full rounded-lg overflow-hidden">
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
                    <span>{item.date}</span>
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

      {/* Modal */}
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
                <option value="Full Day">Full Day</option>
                <option value="Custom Hours">Custom Hours</option>
              </select>
            </div>

            {formData.duration === "Custom Hours" && (
              <>
                <div className="text-sm font-medium">Start Time</div>
                <div className="flex gap-3">
                  <select
                    className="border p-2 rounded"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border p-2 rounded"
                    value={startPeriod}
                    onChange={(e) => setStartPeriod(e.target.value)}
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm font-medium mt-4">End Time</div>
                <div className="flex gap-3">
                  <select
                    className="border p-2 rounded"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border p-2 rounded"
                    value={endPeriod}
                    onChange={(e) => setEndPeriod(e.target.value)}
                  >
                    {periods.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-gray-600 mt-2">
                  🕒 Your requesting <strong>{getTotalHours()}</strong>{" "}
                  {getTotalHours() === 1 ? "hour" : "hours"} off
                </div>
              </>
            )}

            <div className="relative">
              <label className="block mb-1 text-sm font-medium">Reason</label>
              <textarea
                name="reason"
                rows={4}
                className="w-full border p-2 rounded pr-12"
                placeholder="Optional"
                value={formData.reason}
                onChange={handleInputChange}
              />
              <div className="absolute top-1 right-2 text-xs text-gray-500">
                {formData.reason.length}/1000
              </div>
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
