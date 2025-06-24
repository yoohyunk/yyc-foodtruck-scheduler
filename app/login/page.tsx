"use client";

import React, { useState, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ErrorModal from "@/app/components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  createValidationRule,
  sanitizeFormData,
  commonValidationRules,
} from "@/lib/formValidation";

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("Admin");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Refs for form fields
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>("");
  const supabase = createClient();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sanitize form data
    const formData = { email, password };
    const sanitizedData = sanitizeFormData(formData);

    // Validate form data
    const validationRules: ValidationRule[] = [
      commonValidationRules.email(emailRef.current),
      createValidationRule(
        "password",
        true,
        undefined,
        "Password is required.",
        passwordRef.current
      ),
    ];

    const validationErrors = validateForm(sanitizedData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map((error) => error.message);
      setError(errorMessages[0]);
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      // Attempt to sign in with email/password
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });

      if (signInError) {
        setValidationErrors([
          {
            field: "auth",
            message: signInError.message,
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      // Check if user exists in employees table
      if (authData.user) {
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", authData.user.id)
          .single();
        if (employeeError && employeeError.code !== "PGRST116") {
          // PGRST116 means no rows returned, which is expected for new users
          setValidationErrors([
            {
              field: "employee",
              message: "Error checking employee status. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          setLoading(false);
          return;

    if (emp.employee_type === "Admin") {
      router.push("/admin-dashboard");
    } else {
      router.push("/");
    }
  };


        if (!employeeData) {
          // User doesn't exist in employees table - redirect to setup
          router.push("/set-up-employee-info");
          return;
        }

        // User exists - redirect based on role
        if (employeeData.employee_type === "Admin") {
          router.push("/");
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setValidationErrors([
        {
          field: "auth",
          message: "An unexpected error occurred. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/4 ">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat "
          style={{
            backgroundImage: "url('/loginBackground.png')",
          }}
        />
      </div>

      <div className="w-3/4 min-h-screen flex items-center justify-center bg-white px-8">
        <div className="flex flex-col w-full max-w-md min-h-[28rem] bg-white rounded-2xl shadow-2xl p-10 gap-10 border border-gray-100">
          <div className="flex flex-col items-center justify-center mb-6">
            <h2 className=" w-full text-3xl font-bold text-center text-green-800 ">
              Login
            </h2>
          </div>

          <form
            onSubmit={handleLogin}
            className=" flex flex-col justify-between items-center"
          >
            <div className="flex flex-col gap-6 flex-grow">
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-[#f1f9ff]"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-[#f1f9ff]"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="text-end text-sm text-gray-500">
                  <a href="/forgotpassword" className="hover:underline">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-center text-sm">{error}</p>
              )}

              <button
                type="submit"
                className="w-full min-h-8 bg-green-600 text-white py-6 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Login
              </button>
            </div>
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
