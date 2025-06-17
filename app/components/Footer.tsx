"use client";

import React from "react";
import { TutorialButton } from "../tutorial";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary-dark text-white py-4 w-full mt-auto">
      <div className="flex flex-row flex-wrap justify-center items-center gap-6">
        <Link href="/" className="hover:text-primary-light transition-colors">
          Home
        </Link>
        <Link
          href="/about"
          className="hover:text-primary-light transition-colors"
        >
          About
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
