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

  const isSuccess = type === "success";
  const isConfirmation = type === "confirmation";
  const borderColor = isSuccess
    ? "#22c55e"
    : isConfirmation
      ? "#ef4444"
      : "#ef4444";
  const icon = isSuccess ? "✅" : isConfirmation ? "⚠️" : "⚠️";
  const defaultTitle = isSuccess
    ? "Success!"
    : isConfirmation
      ? "Confirm Action"
      : "Please fix the following errors:";
  const headerColor = isSuccess
    ? "text-green-600"
    : isConfirmation
      ? "text-red-600"
      : "text-red-600";
  const buttonColor = isSuccess
    ? "bg-green-500 hover:bg-green-600"
    : isConfirmation
      ? "bg-red-500 hover:bg-red-600"
      : "bg-red-500 hover:bg-red-600";

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(255,255,255,0.7)" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
        style={{ border: `4px solid ${borderColor}` }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-3">{icon}</div>
            <h2 className={`text-xl font-bold ${headerColor} text-center`}>
              {title || defaultTitle}
            </h2>
          </div>

          {/* Error/Success List */}
          <div className="mb-6">
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <li
                  key={index}
                  className={`flex items-start space-x-2 ${
                    isSuccess
                      ? "text-green-700 bg-green-50 border-green-200"
                      : isConfirmation
                        ? "text-red-700 bg-red-50 border-red-200"
                        : "text-red-700 bg-red-50 border-red-200"
                  } p-3 rounded-lg border`}
                >
                  <span
                    className={
                      isSuccess
                        ? "text-green-500 font-bold mt-0.5"
                        : isConfirmation
                          ? "text-red-500 font-bold mt-0.5"
                          : "text-red-500 font-bold mt-0.5"
                    }
                  >
                    •
                  </span>
                  <span className="text-sm leading-relaxed">
                    {error.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex ${isConfirmation ? "justify-between" : "justify-center"} gap-3`}
          >
            {isConfirmation && (
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={isConfirmation ? handleConfirm : onClose}
              className={`${buttonColor} text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105`}
            >
              {isConfirmation ? confirmText : "OK"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
