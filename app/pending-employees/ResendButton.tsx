"use client";

import { useState } from "react";

export function ResendInviteButton({ email }: { email: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setMsg(null);

    const res = await fetch("/api/resend-invite", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();

    if (res.ok) setMsg("Invitation resent successfully.");
    else setMsg(` ${result.error || "Failed to resend invitation."}`);

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {msg ? (
        <span className="text-sm text-green-500 text-center">{msg}</span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="button mt-2"
        >
          {loading ? "Resending..." : "Resend"}
        </button>
      )}
    </div>
  );
}
