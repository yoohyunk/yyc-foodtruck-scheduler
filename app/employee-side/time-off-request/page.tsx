"use client";

import { useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { TimeOffRequestFormData } from "../../types";
import { timeOffRequestsApi } from "@/lib/supabase/timeOffRequests";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "../../components/ErrorModal";
import { ValidationError } from "@/lib/formValidation";

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
  const [dateError, setDateError] = useState<string | null>(null);
  const { shouldHighlight } = useTutorial();

  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalErrors, setErrorModalErrors] = useState<ValidationError[]>(
    []
  );
  const [errorModalTitle, setErrorModalTitle] = useState<string>("");
  const [errorModalType, setErrorModalType] = useState<"error" | "success">(
    "error"
  );

  // Error handling helper functions
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("error");
    setShowErrorModal(true);
  };

  const showSuccess = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("success");
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

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

    // Clear date error when user starts typing
    setDateError(null);

    // Validate dates
    if (name === "start_datetime" && value) {
      const selectedDate = new Date(value);
      const currentDate = new Date();

      if (selectedDate < currentDate) {
        setDateError("Start date and time cannot be in the past.");
        return;
      }
    }

    if (name === "end_datetime" && value) {
      const selectedDate = new Date(value);
      const currentDate = new Date();

      if (selectedDate < currentDate) {
        setDateError("End date and time cannot be in the past.");
        return;
      }
    }

    // If start datetime changes, ensure end datetime is not before it
    if (name === "start_datetime" && value && formData.end_datetime) {
      if (new Date(value) >= new Date(formData.end_datetime)) {
        // Set end datetime to 1 hour after start datetime
        const startDate = new Date(value);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
        const endDateTimeLocal = endDate.toISOString().slice(0, 16);
        setFormData((prev) => ({
          ...prev,
          end_datetime: endDateTimeLocal,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user) {
        showError(
          "Authentication Error",
          "Please log in to submit a time off request."
        );
        return;
      }

      // Get employee ID for current user
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("user_id", user.id)
        .single();

      if (employeeError || !employee) {
        showError(
          "Employee Error",
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

      // Show success message and redirect
      showSuccess("Success", "Time off request submitted successfully!");
      setTimeout(() => {
        router.push("/requests");
      }, 2000);
    } catch (err) {
      console.error("Error submitting time off request:", err);
      showError(
        "Submission Error",
        "Failed to submit time off request. Please try again."
      );
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
      new Date(formData.start_datetime) < new Date(formData.end_datetime) &&
      new Date(formData.start_datetime) >= new Date() &&
      !dateError
    );
  };

  // Get current datetime in local format for min attribute
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="time-off-request-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-dark">
          Request Time Off
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {dateError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{dateError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="input-field w-full"
                  min={getCurrentDateTimeLocal()}
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
                  min={formData.start_datetime || getCurrentDateTimeLocal()}
                  className="input-field w-full"
                />
              </div>
            </TutorialHighlight>
          </div>

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
                className="input-field w-full"
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
                className="input-field w-full"
              />
            </div>
          </TutorialHighlight>

          <div className="flex gap-4 pt-6">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".submit-button")}
              className="submit-button"
            >
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="button bg-primary-dark text-white py-3 px-6 rounded-lg hover:bg-primary-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1"
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
                className="button bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors flex-1"
              >
                Cancel
              </button>
            </TutorialHighlight>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Important Notes:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Please submit your request at least 2 weeks in advance</li>
            <li>• Your request will be reviewed by management</li>

            <li>
              • Emergency requests may be considered on a case-by-case basis
            </li>
          </ul>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        errors={errorModalErrors}
        title={errorModalTitle}
        type={errorModalType}
      />
    </div>
  );
}
