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

      router.push("/admin-dashboard");
      return;
    }

    if (emp.employee_type === "Admin") {
      router.push("/admin-dashboard");
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
    </div>
  );
}