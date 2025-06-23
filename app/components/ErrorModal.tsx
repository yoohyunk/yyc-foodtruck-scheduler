"use client";

import React, { useEffect } from "react";
import { ValidationError, scrollToFirstError } from "../lib/formValidation";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  title?: string;
}

export default function ErrorModal({
  isOpen,
  onClose,
  errors,
  title = "Please fix the following errors:",
}: ErrorModalProps) {
  useEffect(() => {
    if (isOpen && errors && errors.length > 0) {
      // Scroll to the first error element when modal opens
      setTimeout(() => {
        scrollToFirstError(errors);
      }, 300);
    }
  }, [isOpen, errors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(255,255,255,0.7)" }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4 border-red-500">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl mr-3">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 text-center">
              {title}
            </h2>
          </div>

          {/* Error List */}
          <div className="mb-6">
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <li 
                  key={index} 
                  className="flex items-start space-x-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200"
                >
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span className="text-sm leading-relaxed">{error.message}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 