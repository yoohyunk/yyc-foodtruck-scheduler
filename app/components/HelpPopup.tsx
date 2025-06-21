"use client";

import React from "react";

interface HelpPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpPopup({ isOpen, onClose }: HelpPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Address Formatting Tips
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-700">
              <li>Do not add number suffixes to numbered streets</li>
              <li>Postal code is optional</li>
              <li>Make sure to include the street number</li>
              <li>Include the city (Calgary) if not automatically filled</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <h3 className="font-medium text-green-800 mb-2">Example Format:</h3>
            <p className="text-green-700">123 17 Avenue SE, Calgary, AB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
