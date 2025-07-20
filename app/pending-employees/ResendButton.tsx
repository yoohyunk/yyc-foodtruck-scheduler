"use client";

import { useState } from "react";

interface ResendInviteButtonProps {
  email: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function ResendInviteButton({ email, onSuccess, onError }: ResendInviteButtonProps) {
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

    if (res.ok) {
      const successMessage = "Invitation resent successfully.";
      setMsg(successMessage);
      onSuccess?.(successMessage);
    } else {
      const errorMessage = result.error || "Failed to resend invitation.";
      setMsg(errorMessage);
      onError?.(errorMessage);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {msg ? (
        <span 
          className="text-sm text-center"
          style={{ color: "var(--success-medium)" }}
        >
          {msg}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="button btn-primary w-full md:w-auto"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            padding: "1rem 2rem",
            borderRadius: "0.75rem",
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
            transition: "var(--hover-transition)",
            cursor: "pointer",
            border: "2px solid transparent",
            minHeight: "3rem",
            position: "relative",
            overflow: "hidden",
            background: "var(--primary-light)",
            color: "var(--text-primary)",
            boxShadow: "0 6px 20px rgba(255, 213, 134, 0.3)"
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(255, 213, 134, 0.4)";
              e.currentTarget.style.borderColor = "var(--secondary-light)";
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 213, 134, 0.3)";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          {loading ? "Resending..." : "Resend"}
        </button>
      )}
    </div>
  );
}
