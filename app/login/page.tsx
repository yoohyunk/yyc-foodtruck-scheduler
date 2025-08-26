"use client";

import { useState, FormEvent, ChangeEvent, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const supabase = createClient();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // 1) Supabase 로그인
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
    if (signInError || !sessionData.session) {
      setError(signInError?.message || "Login failed");
      return;
    }

    const userId = sessionData.user.id;
    console.log("Login attempt for user ID:", userId, "email:", username);

    // First try to find by user_id
    let { data: emp, error: empError } = await supabase
      .from("employees")
      .select("employee_type, employee_id")
      .eq("user_id", userId)
      .maybeSingle();

    // If not found by user_id, try to find by email
    if (!emp && !empError) {
      console.log("User not found by user_id, trying email...");
      const { data: empByEmail, error: emailError } = await supabase
        .from("employees")
        .select("employee_type, employee_id, user_id")
        .eq("user_email", username)
        .maybeSingle();

      if (empByEmail && !emailError) {
        emp = empByEmail;
        console.log("Found user by email:", empByEmail);

        // If this user doesn't have a user_id set, update it
        if (!empByEmail.user_id) {
          console.log("Updating user_id for existing employee...");

          try {
            const { error: updateError } = await supabase
              .from("employees")
              .update({ user_id: userId })
              .eq("employee_id", empByEmail.employee_id);

            if (updateError) {
              console.error("Error updating user_id:", updateError);
              // Continue anyway - the user can still log in
            } else {
              console.log("Successfully updated user_id");
            }
          } catch (updateException) {
            console.error("Exception during user_id update:", updateException);
            // Continue anyway - the user can still log in
          }
        }
      }
    }

    if (empError) {
      console.error("Error fetching employee:", empError);
      setError(empError.message);
      return;
    }

    if (!emp) {
      console.log("No existing employee found, creating new record...");

      // Try to create employee record with proper error handling
      let newEmp = null;
      let insertError = null;

      try {
        const result = await supabase
          .from("employees")
          .insert({
            user_id: userId,
            user_email: username,
            employee_type: "Employee", // Set default employee type
          })
          .select("employee_id")
          .single();

        newEmp = result.data;
        insertError = result.error;
      } catch (error) {
        console.error("Exception during employee creation:", error);
        insertError = { message: "Database operation failed" };
      }

      if (insertError || !newEmp) {
        console.error("Database error during employee creation:", insertError);

        // Graceful fallback: try to find or create a minimal employee record
        let fallbackEmp = null;

        try {
          // First, try to find any existing record for this user
          const { data: existingEmp } = await supabase
            .from("employees")
            .select("employee_id, employee_type")
            .or(`user_id.eq.${userId},user_email.eq.${username}`)
            .maybeSingle();

          if (existingEmp) {
            fallbackEmp = existingEmp;
            console.log("Found existing employee record:", existingEmp);
          } else {
            // Try to create a minimal record with just essential fields
            console.log("Attempting minimal employee creation...");
            const { data: minimalEmp, error: minimalError } = await supabase
              .from("employees")
              .insert({
                user_id: userId,
                user_email: username,
                employee_type: "Employee",
                is_available: true,
                is_pending: false,
              })
              .select("employee_id")
              .single();

            if (minimalEmp && !minimalError) {
              fallbackEmp = minimalEmp;
              console.log("Successfully created minimal employee record");
            } else {
              console.error("Minimal creation also failed:", minimalError);
            }
          }
        } catch (fallbackError) {
          console.error("Error in fallback employee handling:", fallbackError);
        }

        // Route user based on what we have
        if (fallbackEmp?.employee_id) {
          console.log("Routing to employee page with fallback record");
          router.push(`/employees/${fallbackEmp.employee_id}`);
        } else {
          // Last resort: show helpful error but allow login
          setError(
            "Login successful but employee profile setup incomplete. Please contact support."
          );
          console.log("Routing to home page as fallback");
          router.push("/");
        }
        return;
      }

      // Successfully created employee, route to employee page
      if (newEmp?.employee_id) {
        console.log(
          "Successfully created employee, routing to:",
          newEmp.employee_id
        );
        router.push(`/employees/${newEmp.employee_id}`);
      } else {
        console.log("Employee created but no ID returned, routing to home");
        router.push("/");
      }
      return;
    }

    console.log("Routing user with employee_type:", emp.employee_type);

    if (emp.employee_type === "Admin") {
      console.log("Routing admin user to home page");
      router.push("/");
    } else {
      // Route non-admin users to their employee page
      console.log("Routing non-admin user to employee page");

      if (emp.employee_id) {
        console.log("Using existing employee_id:", emp.employee_id);
        router.push(`/employees/${emp.employee_id}`);
      } else {
        // Fallback: try to get employee_id from database
        console.log("No employee_id in record, attempting database lookup...");

        try {
          const { data: employeeData, error: lookupError } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("user_id", userId)
            .maybeSingle();

          if (lookupError) {
            console.error("Error during employee lookup:", lookupError);
          }

          if (employeeData?.employee_id) {
            console.log(
              "Found employee_id from database:",
              employeeData.employee_id
            );
            router.push(`/employees/${employeeData.employee_id}`);
          } else {
            console.log("No employee_id found in database, routing to home");
            router.push("/");
          }
        } catch (lookupException) {
          console.error("Exception during employee lookup:", lookupException);
          console.log("Routing to home due to lookup exception");
          router.push("/");
        }
      }
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="login-container">
      {/* Background Image Section (Hidden on mobile)*/}
      <div className="login-background-image">
        <div className="login-background-overlay"></div>
      </div>

      {/* Login Form Section */}
      <div className="login-form-section">
        <div className="login-form-card">
          <h2 className="login-form-title">Login</h2>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="form-input"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div style={{ textAlign: "end", marginTop: "0.5rem" }}>
                <a href="/forgotpassword" className="login-forgot-link">
                  Forgot your password?
                </a>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
