"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "@/app/components/ErrorModal";
import Image from "next/image";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // DEVELOPMENT ONLY: Always show the form
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationRules: ValidationRule[] = [
      {
        field: "email",
        required: true,
        validator: (value: unknown) =>
          typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Please enter a valid email address.",
        element: emailRef.current,
      },
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
    const sanitizedData = sanitizeFormData({ email, password });
    const validationErrors = validateForm(sanitizedData, validationRules);
    setValidationErrors(validationErrors);
    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }
    // Optionally, you can use the email in your update logic if needed
    await supabase.auth.updateUser({
      password: sanitizedData.password,
    });
    router.push("/set-up-employee-info");
  };

  // Remove error and !verified checks for development so the form always shows
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Updated layout for branding
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "var(--background-light, #f8fafc)",
        minHeight: "100vh",
      }}
    >
      {/* Logo and site name */}
      <div className="flex flex-col items-center mb-8">
        <Image
          src="/yyctrucks.jpg"
          alt="YYC Food Trucks Logo"
          className="rounded-full shadow-lg mb-2"
          width={64}
          height={64}
        />
        <h1
          className="text-3xl font-bold text-primary-dark mb-1"
          style={{ color: "#16697A" }}
        >
          YYC Food Trucks
        </h1>
        <span className="text-lg text-gray-600 font-semibold">
          Set Your Password
        </span>
      </div>
      {/* Card */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl border border-primary-light">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-1 font-semibold text-gray-700"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-primary-dark focus:outline-none"
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block mb-1 font-semibold text-gray-700"
            >
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:ring-primary-dark focus:outline-none"
              autoComplete="new-password"
            />
            <div className="mt-2 text-right">
              <a
                href="/forgot-password"
                className="text-sm text-green-600 hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
          >
            Set Password
          </button>
        </form>
      </div>
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </div>
  );
}
