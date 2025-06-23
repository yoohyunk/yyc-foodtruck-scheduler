"use client";

import React, { useEffect, useState, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "@/app/components/ErrorModal";
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validatePassword, createValidationRule, sanitizeFormData, commonValidationRules } from "@/lib/formValidation";

export default function SetPasswordPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Refs for form fields
  const passwordRef = useRef<HTMLInputElement>(null);

  // Parse hash fragment and set session
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ data, error: sessionError }) => {
          if (sessionError || !data.session) {
            console.error("Session error:", sessionError);
            setError("Failed to verify invitation. Please try again.");
          } else {
            setVerified(true);
          }
        })
        .catch((err) => {
          console.error("Error setting session:", err);
          setError("Error setting session. Please try again.");
        })
        .finally(() => setLoading(false));
    } else {
      setError("Missing tokens in URL.");
      setLoading(false);
    }
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormErrors([]);

    // Sanitize form data
    const formData = { password };
    const sanitizedData = sanitizeFormData(formData);

    // Validate form data
    const validationRules: ValidationRule[] = [
      commonValidationRules.password(passwordRef.current),
    ];

    const validationErrors = validateForm(sanitizedData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(error => error.message);
      setFormErrors(errorMessages);
      setShowErrorModal(true);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: sanitizedData.password });
    if (updateError) {
      console.error("Password update error:", updateError);
      setError(updateError.message);
    } else {
      router.push("/set-up-employee-info");
    }
  };

  const handleScrollToFirstError = () => {
    const formData = { password };
    const sanitizedData = sanitizeFormData(formData);
    
    const validationRules: ValidationRule[] = [
      commonValidationRules.password(passwordRef.current),
    ];

    const validationErrors = validateForm(sanitizedData, validationRules);
    if (validationErrors.length > 0) {
      scrollToFirstError(validationErrors);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-600 mb-4">Unable to set password.</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Set Your Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            {error && <p className="text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Set Password
            </button>
          </form>
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
