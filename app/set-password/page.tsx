"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "@/app/components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  sanitizeFormData,
  validatePassword,
} from "../../lib/formValidation";

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    //  CHECK IF USER IS LOGGED IN. IF THEY ARE LOGGED IN, JUST SHOW PASSWORD RESET FORM
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setVerified(true);
        setLoading(false);
        return;
      }
      // ...rest of your logic
    };
    checkUser();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationRules: ValidationRule[] = [
      {
        field: "password",
        required: true,
        validator: (value: unknown) =>
          typeof value === "string" && validatePassword(value),
        message:
          "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.",
        element: passwordRef.current,
      },
    ];
    const sanitizedData = sanitizeFormData({ password });
    const validationErrors = validateForm(sanitizedData, validationRules);
    setValidationErrors(validationErrors);
    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({
      password: sanitizedData.password,
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/set-up-employee-info");
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
