"use client";

import React from "react";
import { TutorialButton } from "../tutorial";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-4 w-full mt-auto">
      <div className="flex flex-row flex-wrap justify-center items-center gap-6">
        <Link
          href="/"
          className="hover:text-primary-light transition-colors font-bold flex items-center"
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
        <Link
          href="/about"
          className="hover:text-primary-light transition-colors"
        >
          About Trucks
        </Link>
        <Link
          href="/contact"
          className="hover:text-primary-light transition-colors"
        >
          Contact
        </Link>
        <TutorialButton />
        <span className="text-sm text-primary-light ml-4">
          © {new Date().getFullYear()} YYC Food Trucks
        </span>
      </div>
    </footer>
  );
}
