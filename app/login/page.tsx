"use client";

import { useState, FormEvent, ChangeEvent, ReactElement } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "Admin" | "Employee";

export default function LoginPage(): ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("Admin");
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
      router.push("/mainpage");
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
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

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
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

          <div>
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
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          <a href="/forgotpassword" className="hover:underline">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}
