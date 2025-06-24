"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiLogOut,
  FiCalendar,
  FiUser,
  FiMenu,
  FiX,
  FiHome,
} from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useTutorial } from "@/app/tutorial/TutorialContext";
import { TutorialHighlight } from "@/app/components/TutorialHighlight";

const employeeNavLinks = [
  { name: "Profile", href: "/employee-side/profile", icon: <FiUser /> },
  { name: "Schedule", href: "/employee-side/schedule", icon: <FiCalendar /> },
  {
    name: "Time Off",
    href: "/employee-side/time-off",
    icon: <FiCalendar />,
  },
];

const quickActionLinks = [
  {
    name: "Request Time Off",
    href: "/employee-side/time-off-request",
    icon: "+",
  },
  { name: "Edit Profile", href: "/employee-side/profile/edit", icon: "+" },
];

export default function EmployeeHeader() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(employeeNavLinks.length);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const normalize = (path: string) => path.replace(/\/$/, "");

  const { shouldHighlight } = useTutorial();
  const highlightLogo = shouldHighlight(".logo.TutorialHighlight");

  useEffect(() => setIsClient(true), []);

  useLayoutEffect(() => {
    if (!isClient) return;
    function updateTabs() {
      if (!navRef.current) return;
      const navWidth = navRef.current.offsetWidth;
      let used = 0;
      let count = 0;
      for (let i = 0; i < employeeNavLinks.length; i++) {
        const tab = tabRefs.current[i];
        if (!tab) continue;
        const tabWidth = tab.offsetWidth;
        if (used + tabWidth + 60 < navWidth) {
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

  const visibleLinks = employeeNavLinks.slice(0, visibleCount);
  const overflowLinks = employeeNavLinks.slice(visibleCount);

  return (
    <header className="header">
      <nav className="nav-container flex items-center justify-between">
        <TutorialHighlight
          isHighlighted={highlightLogo}
          className="logo flex items-center shrink-0"
        >
          <Link href="/employee-side" className="flex items-center">
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
        <div className="flex items-center">
          <div
            ref={navRef}
            className="nav-links flex space-x-2 ml-4 overflow-hidden"
          >
            {visibleLinks.map((link, i) => {
              const isActive = normalize(pathname) === normalize(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1 nav-link ${
                    isActive
                      ? "!text-yellow-400 font-bold underline"
                      : "text-white"
                  }`}
                  ref={(el) => {
                    if (el) {
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
              );
            })}
          </div>
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
          {(overflowLinks.length > 0 || !isClient) && (
            <button
              onClick={toggleMenu}
              className="nav-link flex items-center space-x-1 ml-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          )}
        </div>
      </nav>
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
