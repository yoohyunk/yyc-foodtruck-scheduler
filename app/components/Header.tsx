"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiLogOut,
  FiUsers,
  FiCalendar,
  FiPlus,
  FiHome,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { NavLink } from "../types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";

const mainNavLinks: NavLink[] = [
  { name: "Employees", href: "/employees/", icon: <FiUsers /> },
  { name: "Events", href: "/events/", icon: <FaRegCalendarAlt /> },
  { name: "Schedule", href: "/schedule/", icon: <FiCalendar /> },
  { name: "New Employee", href: "/employees/newEmployee/", icon: <FiPlus /> },
  { name: "New Event", href: "/events/newEvent", icon: <FiPlus /> },
];

export default function Header(): React.ReactElement {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(mainNavLinks.length);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Tutorial highlight logic
  const { shouldHighlight } = useTutorial();
  const highlightLogo = shouldHighlight(".logo.TutorialHighlight");

  // Ensure code only runs on client
  useEffect(() => setIsClient(true), []);

  // Calculate how many tabs fit
  useLayoutEffect(() => {
    if (!isClient) return;
    function updateTabs() {
      if (!navRef.current) return;
      const navWidth = navRef.current.offsetWidth;
      let used = 0;
      let count = 0;
      for (let i = 0; i < mainNavLinks.length; i++) {
        const tab = tabRefs.current[i];
        if (!tab) continue;
        const tabWidth = tab.offsetWidth;
        if (used + tabWidth + 60 /* buffer for logo and auth */ < navWidth) {
          used += tabWidth;
          count++;
        } else {
          break;
        }
      }
      setVisibleCount(count);
    }
    updateTabs();
    window.addEventListener("resize", updateTabs);
    return () => window.removeEventListener("resize", updateTabs);
  }, [isClient]);

  const toggleMenu = () => setIsMenuOpen((v) => !v);
  const closeMenu = () => setIsMenuOpen(false);

  // Split links into visible and overflow
  const visibleLinks = mainNavLinks.slice(0, visibleCount);
  const overflowLinks = mainNavLinks.slice(visibleCount);

  return (
    <header className="header">
      <nav className="nav-container flex items-center justify-between">
        <div className="flex items-center w-full">
          <TutorialHighlight isHighlighted={highlightLogo} className="logo flex items-center shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/yyctrucks.jpg"
                alt="YYC Logo"
                width={48}
                height={48}
                className="logo-img rounded"
              />
              <span className="ml-2 text-xl font-bold whitespace-nowrap text-white">
                YYC Food Trucks
              </span>
            </Link>
          </TutorialHighlight>
          {/* Progressive nav links */}
          <div
            ref={navRef}
            className="nav-links flex space-x-2 ml-4 overflow-hidden flex-1"
          >
            {visibleLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link flex items-center space-x-1"
                ref={(el) => {
                  // Handle the ref properly for Next.js Link component
                  if (el) {
                    // Find the actual anchor element within the Link
                    const anchorElement = el.querySelector("a") || el;
                    tabRefs.current[i] = anchorElement as HTMLElement;
                  } else {
                    tabRefs.current[i] = null;
                  }
                }}
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* Desktop Auth Section */}
        <div className="hidden lg:block ml-2">
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
        {/* Hamburger always shows if there are overflow links */}
        {(overflowLinks.length > 0 || !isClient) && (
          <button
            onClick={toggleMenu}
            className="nav-link flex items-center space-x-1 ml-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        )}
      </nav>
      {/* Mobile/Overflow Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-links">
              {overflowLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mobile-nav-link"
                  onClick={closeMenu}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
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
