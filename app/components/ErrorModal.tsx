"use client";

import React from "react";
import { ValidationError } from "../../lib/formValidation";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  title?: string;
  type?: "error" | "success" | "confirmation";
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  errors,
  title,
  type = "error",
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ErrorModalProps) {
  if (!isOpen) return null;

  // Modern minimalist palette
  const accent =
    type === "success"
      ? "#2A9D8F"
      : type === "confirmation"
        ? "#F4A261"
        : "#E63946";
  const icon =
    type === "success" ? "✔️" : type === "confirmation" ? "❓" : "⛔";
  const isSuccess = type === "success";
  const isConfirmation = type === "confirmation";
  const defaultTitle = isSuccess
    ? "Success!"
    : isConfirmation
      ? "Confirm Action"
      : "Please fix the following errors:";

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(34,34,34,0.12)" }}
    >
      <div
        className="max-w-md w-full mx-4 rounded-xl shadow-xl"
        style={{
          background: "#fff",
          padding: "2.5rem 2rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          border: "none",
        }}
      >
        <div className="flex flex-col items-center">
          <div
            className="text-5xl"
            style={{
              color: accent,
              animation:
                type === "error"
                  ? "shake 0.3s"
                  : type === "success"
                    ? "bounce 0.4s"
                    : undefined,
              marginBottom: "2.25rem", // increased gap under icon
            }}
            aria-label={type}
          >
            {icon}
          </div>
          <h2
            className="text-2xl font-bold mb-2 text-center"
            style={{
              color: "#222",
              fontFamily: "'Nunito', 'Quicksand', 'Inter', sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            {title || defaultTitle}
          </h2>
          <ul className="mb-6 w-full text-center">
            {errors.map((error, idx) => (
              <li
                key={idx}
                className="text-base mb-2"
                style={{
                  color: "#222",
                  fontFamily: "'Nunito', 'Quicksand', 'Inter', sans-serif",
                }}
              >
                {error.message}
              </li>
            ))}
          </ul>
          <div
            className="flex flex-col sm:flex-row gap-3 w-full"
            style={{ marginTop: "2rem" }}
          >
            {isConfirmation && (
              <button
                onClick={onClose}
                className="flex-1 rounded-full font-bold shadow"
                style={{
                  background: "#f6f6f6",
                  color: "#222",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  height: "3.25rem",
                  fontSize: "1.1rem",
                }}
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={isConfirmation ? handleConfirm : onClose}
              className="flex-1 rounded-full font-bold shadow"
              style={{
                background: accent,
                color: "#fff",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                height: "3.25rem",
                fontSize: "1.1rem",
              }}
            >
              {isConfirmation ? confirmText : "OK"}
            </button>
          </div>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);}
          50% { transform: translateY(-8px);}
        }
      `}</style>
    </div>
  );
}
