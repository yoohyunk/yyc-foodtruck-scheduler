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
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("employee_type")
      .eq("user_id", userId)
      .maybeSingle();
    if (empError) {
      setError(empError.message);
      return;
    }

    if (!emp) {
      const { error: insertError } = await supabase.from("employees").insert({
        user_id: userId,
        user_email: username,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push("/");
      return;
    }

    if (emp.employee_type === "Admin") {
      router.push("/");
    } else {
      router.push("/");
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
