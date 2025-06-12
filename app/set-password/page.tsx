"use client";

import React, { useEffect, useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);

  // Parse hash fragment, set session, and verify
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ data, error: sessionError }) => {
          if (sessionError || !data.session) {
            setError("Failed to verify invitation.");
          } else {
            setVerified(true);
          }
        })
        .catch(() => {
          setError("Error setting session.");
        })
        .finally(() => setLoading(false));
    } else {
      setError("Missing tokens in URL.");
      setLoading(false);
    }
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return <p>Verifying invitation...</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!verified) {
    return <p className="text-red-600">Unable to set password.</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Set Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Set Password
          </button>
        </form>
      </div>
    </div>
  );
}
