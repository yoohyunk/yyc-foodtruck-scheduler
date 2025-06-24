"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
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
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";
import { usePathname } from "next/navigation";

const mainNavLinks: NavLink[] = [
  { name: "Employees", href: "/employees/", icon: <FiUsers /> },
  { name: "Events", href: "/events/", icon: <FaRegCalendarAlt /> },
  { name: "Schedule", href: "/schedule/", icon: <FiCalendar /> },
];

const quickActionLinks = [
  { name: "New Shift", href: "/schedule/new", icon: "+" },
  { name: "Add Staff", href: "/employees/newEmployee", icon: "+" },
  { name: "Create Event", href: "/events/newEvent", icon: "+" },
];

export default function Header(): React.ReactElement {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(mainNavLinks.length);
  const [showHamburger, setShowHamburger] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const [tabWidths, setTabWidths] = useState<number[]>([]);
  const measureRefs = useRef<(HTMLElement | null)[]>([]);

  // Tutorial highlight logic
  const { shouldHighlight } = useTutorial();
  const highlightLogo = shouldHighlight(".logo.TutorialHighlight");

  // Ensure code only runs on client
  useEffect(() => setIsClient(true), []);

  // Measure true widths using a hidden container
  useLayoutEffect(() => {
    if (!isClient) return;
    function measureTabWidths() {
      if (!measureRefs.current) return;
      const widths = mainNavLinks.map((_, i) => {
        const el = measureRefs.current[i];
        return el ? el.offsetWidth : 0;
      });
      setTabWidths(widths);
    }
    measureTabWidths();
    window.addEventListener("resize", measureTabWidths);
    return () => window.removeEventListener("resize", measureTabWidths);
  }, [isClient]);

  // Calculate how many tabs fit and whether to show hamburger
  useLayoutEffect(() => {
    if (!isClient) return;
    function updateLayout() {
      if (!navRef.current) return;
      const containerWidth = navRef.current.parentElement?.offsetWidth || 0;
      const logoWidth = 220;
      const authWidth = 140;
      const padding = 80;
      const SAFETY_BUFFER = 80; // Increased buffer for more conservative hiding
      const availableWidth =
        containerWidth - logoWidth - authWidth - padding - SAFETY_BUFFER;
      let used = 0;
      let count = 0;
      for (let i = 0; i < tabWidths.length; i++) {
        if (used + tabWidths[i] <= availableWidth) {
          used += tabWidths[i];
          count++;
        } else {
          break;
        }
      }
      // If not all tabs fit, force all into hamburger menu
      if (count < mainNavLinks.length) {
        count = 0;
      }
      setVisibleCount(count);
      setShowHamburger(count < mainNavLinks.length || containerWidth < 1024);
    }
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [isClient, tabWidths]);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  // Helper to determine if a link is active
  const isActive = (href: string) => {
    // Normalize trailing slashes
    const normalize = (path: string) => path.replace(/\/$/, "");
    return normalize(pathname) === normalize(href.replace(/\/$/, ""));
  };

  return (
    <header className="header">
      <nav className="nav-container flex items-center justify-between">
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

        {/* Right Section - Nav Links + Auth */}
        <div className="flex items-center gap-6 nav-right">
          {/* Navigation Links */}
          <div ref={navRef} className="nav-links">
            <div className="nav-links-container flex items-center gap-4">
              {mainNavLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link${isActive(link.href) ? " nav-link-active" : ""}${i >= visibleCount ? " nav-link-hidden" : ""}`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span className="nav-text">{link.name}</span>
                </Link>
              ))}
            </div>
          </div>

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

          {/* Hamburger menu - show only when needed */}
          {showHamburger && (
            <button
              onClick={toggleMenu}
              className="hamburger-button"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile/Overflow Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-links">
              {/* Main navigation links that don't fit */}
              {mainNavLinks.map((link, i) =>
                i >= visibleCount ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`mobile-nav-link${isActive(link.href) ? " nav-link-active" : ""}`}
                    onClick={closeMenu}
                    aria-current={isActive(link.href) ? "page" : undefined}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                ) : null
              )}

              {/* Quick Actions Section */}
              <div className="mobile-quick-actions">
                <h4 className="mobile-section-title">Quick Actions</h4>
                {quickActionLinks.map((link, index) => {
                  const selector = `.mobile-quick-actions .TutorialHighlight:nth-child(${index + 1})`;
                  const isHighlighted = shouldHighlight(selector);
                  return (
                    <TutorialHighlight
                      key={index}
                      isHighlighted={isHighlighted}
                      className="mobile-nav-link"
                    >
                      <Link href={link.href} onClick={closeMenu}>
                        <span className="nav-icon">{link.icon}</span>
                        <span>{link.name}</span>
                      </Link>
                    </TutorialHighlight>
                  );
                })}
              </div>
            </div>

            <div className="mobile-auth-section">
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="mobile-nav-link"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="mobile-nav-link"
                  onClick={closeMenu}
                >
                  <FiHome />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
