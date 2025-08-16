"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBaseUrl } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSent(false);

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/set-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <form
      onSubmit={handleForgot}
      className="max-w-sm mx-auto mt-20 p-8 bg-white rounded-xl shadow"
    >
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 rounded"
      >
        Send Reset Link
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {sent && (
        <div className="text-green-600 mt-2">
          A password reset link has been sent to your email.
        </div>
      )}
    </form>
  );
}
