"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { FiLogOut, FiHome, FiMenu } from "react-icons/fi";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";
import { employeesApi } from "@/lib/supabase/employees";
import ProfileAvatar from "./ProfileAvatar";
import ProfileDropdown from "./ProfileDropdown";

// Generate consistent random color based on user ID
const getRandomColor = (userId: string) => {
  const colors = [
    "#4285f4", // Blue
    "#ea4335", // Red
    "#fbbc04", // Yellow
    "#34a853", // Green
    "#ff6d01", // Orange
    "#46bdc6", // Teal
    "#7b1fa2", // Purple
    "#d81b60", // Pink
    "#5e35b1", // Deep Purple
    "#00897b", // Deep Teal
    "#e91e63", // Pink
    "#3f51b5", // Indigo
  ];

  // Generate hash from userId for consistent color selection
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return colors[Math.abs(hash) % colors.length];
};

export default function Header(): React.ReactElement {
  const { user, signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>("");
  const [profileColor, setProfileColor] = useState<string>("#4285f4");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Tutorial highlight logic
  const { shouldHighlight } = useTutorial();
  const highlightLogo = shouldHighlight(".logo.TutorialHighlight");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".profile-dropdown-container")) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Fetch employee data and set user initials
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user) {
        const employee = await employeesApi.getEmployeeByUserId(user.id);
        setEmployeeId(employee?.employee_id || null);

        // Set user-specific random color
        setProfileColor(getRandomColor(user.id));

        // Extract user initials from name
        if (employee?.first_name && employee?.last_name) {
          const firstName = employee.first_name.charAt(0).toUpperCase();
          const lastName = employee.last_name.charAt(0).toUpperCase();
          setUserInitials(`${firstName}${lastName}`);
        } else if (employee?.first_name) {
          setUserInitials(employee.first_name.charAt(0).toUpperCase());
        } else {
          setUserInitials("U"); // Default fallback
        }
      }
    };
    fetchEmployeeData();
  }, [user]);

  // Check screen size for mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileView);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Handle profile button click (mobile only)
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) {
      setShowProfileDropdown(!showProfileDropdown);
    }
  };

  // Handle logout action
  const handleLogout = () => {
    setShowProfileDropdown(false);
    signOut();
  };

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
          {/* Auth Section */}
          <div className="auth-section">
            {user && employeeId && (
              <div className="profile-dropdown-container">
                <ProfileAvatar
                  initials={userInitials}
                  color={profileColor}
                  employeeId={employeeId}
                  isMobile={isMobile}
                  onClick={handleProfileClick}
                />

                {/* Mobile Profile Dropdown */}
                <ProfileDropdown
                  isVisible={isMobile && showProfileDropdown}
                  employeeId={employeeId}
                  onClose={() => setShowProfileDropdown(false)}
                  onLogout={handleLogout}
                />
              </div>
            )}

            {/* Desktop Logout Button */}
            {user && !isMobile ? (
              <button onClick={signOut} className="auth-button">
                <FiLogOut />
                <span>Logout</span>
              </button>
            ) : !user ? (
              <Link href="/login" className="auth-button">
                <FiHome size={20} />
                <span>Login</span>
              </Link>
            ) : null}
          </div>

          {/* Mobile Hamburger Menu Button */}
          {isMobile && (
            <button
              onClick={() => {
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
