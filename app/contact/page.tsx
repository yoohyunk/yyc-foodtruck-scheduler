"use client";

import React from "react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Contact YYC Food Trucks
            </h1>
            <p className="text-lg text-gray-600">
              Get in touch with our team for support, questions, or inquiries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Emergency Contact */}
            <div className="bg-red-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4">
                Emergency Contact
              </h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-800 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-gray-700">jeremy.andrews@yycfoodtrucks.com</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-800 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-gray-700">(403) 555-0128</span>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-800 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-gray-700">Jeremy Andrews - Co-Owner</span>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Operators */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">
                Owner Operators
              </h2>
              <div className="space-y-6">
                {/* Jen Andrews */}
                <div className="border-b border-purple-200 pb-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Jen Andrews</h3>
                  <p className="text-sm text-purple-700 mb-3">Co-Owner & Operations Director</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">jen.andrews@yycfoodtrucks.com</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">(403) 555-0127</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">Calgary, AB</span>
                    </div>
                  </div>
                </div>
                
                {/* Jeremy Andrews */}
                <div>
                  <h3 className="font-semibold text-purple-900 mb-2">Jeremy Andrews</h3>
                  <p className="text-sm text-purple-700 mb-3">Co-Owner & Business Development</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">jeremy.andrews@yycfoodtrucks.com</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">(403) 555-0128</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-purple-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">Calgary, AB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-orange-800 mb-4">
                Accounting
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Kelly</h3>
                  <p className="text-sm text-orange-700 mb-3">Senior Accountant</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-orange-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">kelly@yycfoodtrucks.com</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-orange-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">(403) 555-0129</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-orange-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">Calgary, AB</span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 text-orange-800 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">Ext. 101</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Office Hours
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Monday - Friday</h3>
                <p className="text-gray-600">8:00 AM - 6:00 PM MST</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Saturday</h3>
                <p className="text-gray-600">9:00 AM - 4:00 PM MST</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Emergency support is available 24/7 for urgent matters.
            </p>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary-medium transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 