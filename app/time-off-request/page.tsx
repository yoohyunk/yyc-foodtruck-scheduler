"use client";

import { useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { TimeOffRequestFormData } from "../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function TimeOffRequestPage(): ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [formData, setFormData] = useState<TimeOffRequestFormData>({
    start_datetime: "",
    end_datetime: "",
    reason: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { shouldHighlight } = useTutorial();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) {
        setError("Please log in to submit a time off request.");
        return;
      }

      // Get employee ID for current user
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("user_id", user.id)
        .single();

      if (employeeError || !employee) {
        setError(
          "Employee information not found. Please contact your administrator."
        );
        return;
      }

      await timeOffRequestsApi.createTimeOffRequest({
        employee_id: employee.employee_id,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        reason: formData.reason,
        type: formData.type,
        status: "Pending",
      });

      // Redirect to success page or show success message
      alert("Time off request submitted successfully!");
      router.push("/requests");
    } catch (err) {
      console.error("Error submitting time off request:", err);
      setError("Failed to submit time off request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.start_datetime &&
      formData.end_datetime &&
      formData.reason.trim() &&
      formData.type &&
      new Date(formData.start_datetime) < new Date(formData.end_datetime)
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-primary-dark mb-6">
          Request Time Off
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <TutorialHighlight
            isHighlighted={shouldHighlight(".start-datetime-field")}
            className="start-datetime-field"
          >
            <div>
              <label
                htmlFor="start_datetime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="start_datetime"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
              />
            </div>
          </TutorialHighlight>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".end-datetime-field")}
            className="end-datetime-field"
          >
            <div>
              <label
                htmlFor="end_datetime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                id="end_datetime"
                name="end_datetime"
                value={formData.end_datetime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
              />
            </div>
          </TutorialHighlight>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".reason-field")}
            className="reason-field"
          >
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Reason for Time Off *
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Please provide a detailed reason for your time off request..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
              />
            </div>
          </TutorialHighlight>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".type-field")}
            className="type-field"
          >
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type of Time Off *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
              >
                <option value="">Select a type</option>
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal Leave">Personal Leave</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </TutorialHighlight>

          <div className="flex gap-4 pt-4">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".submit-button")}
              className="submit-button"
            >
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="flex-1 bg-primary-dark text-white py-2 px-4 rounded-md hover:bg-primary-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </TutorialHighlight>

            <TutorialHighlight
              isHighlighted={shouldHighlight(".cancel-button")}
              className="cancel-button"
            >
              <button
                type="button"
                onClick={() => router.push("/requests")}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </TutorialHighlight>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Important Notes:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Please submit your request at least 2 weeks in advance</li>
            <li>• Your request will be reviewed by management</li>
            <li>• You will be notified of the approval status</li>
            <li>
              • Emergency requests may be considered on a case-by-case basis
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
