"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FiLogOut, FiHome } from "react-icons/fi";

export default function EmployeeHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="header-employee bg-stone-200 text-black">
      <nav
        className="nav-container flex items-center justify-end"
        style={{ justifyContent: "flex-end" }}
      >
        <div className="flex items-center">
          {/* Logout button */}
          <div>
            {user ? (
              <button
                onClick={signOut}
                className="nav-link flex items-center space-x-1"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="nav-link flex items-center space-x-1"
              >
                <FiHome />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}