"use client";

import React, { useState, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "@/app/components/ErrorModal";
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validateEmail, validateRequired, createValidationRule, sanitizeFormData, commonValidationRules } from "@/app/lib/formValidation";

type Role = "Admin" | "Employee";

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("Admin");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Refs for form fields
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFormErrors([]);

    // Sanitize form data
    const formData = { email, password };
    const sanitizedData = sanitizeFormData(formData);

    // Validate form data
    const validationRules: ValidationRule[] = [
      commonValidationRules.email(emailRef.current),
      createValidationRule("password", true, undefined, "Password is required.", passwordRef.current),
    ];

    const validationErrors = validateForm(sanitizedData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(error => error.message);
      setFormErrors(errorMessages);
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitizedData.email,
      password: sanitizedData.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleScrollToFirstError = () => {
    const formData = { email, password };
    const sanitizedData = sanitizeFormData(formData);
    
    const validationRules: ValidationRule[] = [
      commonValidationRules.email(emailRef.current),
      createValidationRule("password", true, undefined, "Password is required.", passwordRef.current),
    ];

    const validationErrors = validateForm(sanitizedData, validationRules);
    if (validationErrors.length > 0) {
      scrollToFirstError(validationErrors);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen bg-gradient-to-br from-green-100 via-yellow-100 to-green-200 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-10 space-y-6 border border-gray-100">
          <div className="flex justify-center">
            <Image
              src="/images/dfe0cb48-d05f-4f02-88be-7302537507d9.jpg"
              alt="YYC Food Trucks"
              width={100}
              height={100}
              className="rounded-lg object-contain shadow-md"
            />
          </div>

          <h2 className="text-3xl font-bold text-center text-green-800">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-[#f1f9ff]"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-[#f1f9ff]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole("Employee")}
                className={`w-1/2 py-2 rounded-lg font-medium border ${
                  role === "Employee"
                    ? "bg-green-600 text-white"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                Employee
              </button>
              <button
                type="button"
                onClick={() => setRole("Admin")}
                className={`w-1/2 py-2 rounded-lg font-medium border ${
                  role === "Admin"
                    ? "bg-green-600 text-white"
                    : "bg-white border-gray-300 text-gray-700"
                }`}
              >
                Admin
              </button>
            </div>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <a href="/forgotpassword" className="hover:underline">
              Forgot your password?
            </a>
          </div>
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
