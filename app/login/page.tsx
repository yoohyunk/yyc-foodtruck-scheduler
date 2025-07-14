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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background solid colors */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: "var(--accent-warning)" }}
      ></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div
          className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-pulse"
          style={{ background: "var(--accent-warning)" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-24 h-24 rounded-full opacity-30 animate-pulse delay-1000"
          style={{ background: "var(--accent-error)" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full opacity-25 animate-pulse delay-500"
          style={{ background: "var(--accent-light)" }}
        ></div>
      </div>

      <div className="w-1/4 relative z-10">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: "url('/loginBackground.png')",
          }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "var(--accent-warning)", opacity: 0.2 }}
          ></div>
        </div>
      </div>

      <div className="w-3/4 min-h-screen flex items-center justify-center px-8 relative z-10">
        <div
          className="flex flex-col w-full max-w-md min-h-[32rem] bg-white rounded-3xl shadow-2xl p-12 gap-8 border-4 relative overflow-hidden"
          style={{ borderColor: "var(--accent-warning)" }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 left-0 w-full h-2"
            style={{ background: "var(--primary-dark)" }}
          ></div>
          <div
            className="absolute top-4 right-4 w-8 h-8 rounded-full opacity-60"
            style={{ background: "var(--accent-error)" }}
          ></div>
          <div
            className="absolute bottom-4 left-4 w-6 h-6 rounded-full opacity-60"
            style={{ background: "var(--accent-warning)" }}
          ></div>

          <div className="flex flex-col items-center justify-center mb-8">
            <h2
              className="w-full text-4xl font-black text-center"
              style={{ color: "var(--primary-dark)" }}
            >
              Login
            </h2>
            <div
              className="w-24 h-1 rounded-full mt-4"
              style={{ background: "var(--accent-warning)" }}
            ></div>
          </div>

          <form
            onSubmit={handleLogin}
            className="flex flex-col justify-between items-center flex-grow"
          >
            <div className="flex flex-col gap-8 flex-grow w-full">
              <div className="space-y-3">
                <label
                  className="block text-sm font-bold mb-2 uppercase tracking-wide"
                  style={{ color: "var(--text-primary)" }}
                >
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className="w-full px-6 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 bg-white text-lg font-medium transition-all duration-300"
                    style={{
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--accent-warning)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 4px var(--accent-warning)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                    placeholder="Enter your username"
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 w-1 rounded-r-xl"
                    style={{ background: "var(--accent-warning)" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <label
                  className="block text-sm font-bold mb-2 uppercase tracking-wide"
                  style={{ color: "var(--text-primary)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full px-6 py-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 bg-white text-lg font-medium transition-all duration-300"
                    style={{
                      color: "var(--text-primary)",
                      borderColor: "var(--border)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--accent-warning)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 4px var(--accent-warning)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "";
                    }}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 transition-colors duration-300"
                    style={{ color: "var(--text-primary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--accent-warning)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                  >
                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                  <div
                    className="absolute inset-y-0 right-0 w-1 rounded-r-xl"
                    style={{ background: "var(--accent-warning)" }}
                  ></div>
                </div>
                <div className="text-end">
                  <a
                    href="/forgotpassword"
                    className="text-sm hover:underline font-medium transition-colors duration-300"
                    style={{ color: "var(--accent-error)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--accent-error)";
                    }}
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              {error && (
                <div
                  className="p-4 rounded-xl border-2"
                  style={{
                    background: "var(--accent-error)",
                    borderColor: "var(--accent-error)",
                  }}
                >
                  <p className="text-white text-center text-sm font-bold">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full text-white py-6 rounded-xl font-black text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 border-2 border-transparent"
                style={{ background: "var(--primary-dark)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-warning)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
