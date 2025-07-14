"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

import {
  FiLogOut,
  FiUsers,
  FiCalendar,
  FiHome,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { NavLink } from "../types";

import { FiLogOut, FiHome, FiMenu } from "react-icons/fi";

import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";
import { usePathname } from "next/navigation";

const mainNavLinks: NavLink[] = [
  { name: "Employees", href: "/employees/", icon: <FiUsers /> },
  { name: "Events", href: "/events/", icon: <FaRegCalendarAlt /> },
  { name: "Schedule", href: "/schedule/", icon: <FiCalendar /> },
];

export default function Header(): React.ReactElement {
  const { user, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Tutorial highlight logic
  const { shouldHighlight } = useTutorial();
  const highlightLogo = shouldHighlight(".logo.TutorialHighlight");

  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileView);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <header className="header">
      <nav className="nav-container">
        {/* Logo Section */}
        <TutorialHighlight isHighlighted={highlightLogo} className="logo">
          <Link href="/" className="logo-link">
            <Image
              src="/yyctrucks.jpg"
              alt="YYC Logo"
              width={48}
              height={48}
              className="logo-img"
            />
            <span className="logo-text">YYC Food Trucks</span>
          </Link>
        </TutorialHighlight>

        {/* Right Section - Auth and Hamburger */}
        <div className="nav-right">
          {/* Desktop Auth Section */}
          <div className="auth-section">
            {user ? (
              <button onClick={signOut} className="auth-button">
                <FiLogOut />
                <span>Logout</span>
              </button>
            ) : (
              <Link href="/login" className="auth-button">
                <FiHome />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Hamburger Menu Button - shown on mobile */}
          {isMobile && (
            <button
              onClick={() => {
                // This will be handled by the Sidebar component
                const event = new CustomEvent("toggleSidebar");
                window.dispatchEvent(event);
              }}
              className="hamburger-button"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={20} />
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
