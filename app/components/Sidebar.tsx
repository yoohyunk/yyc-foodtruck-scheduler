"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiCalendar,
  FiTruck,
  FiFileText,
  FiPlus,
  FiBarChart2,
  FiHome,
  FiInfo,
} from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { NavLink } from "../types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Sidebar navigation links
const sidebarLinks: NavLink[] = [
  { name: "Dashboard", href: "/", icon: <FiHome /> },
  { name: "Employees", href: "/employees/", icon: <FiUsers /> },
  { name: "Add Employee", href: "/employees/newEmployee", icon: <FiPlus /> },
  { name: "Events", href: "/events/", icon: <FaRegCalendarAlt /> },
  { name: "Add Shift", href: "/events/addShift", icon: <FiPlus /> },
  { name: "Add Event", href: "/events/newEvent", icon: <FiPlus /> },
  { name: "Schedule", href: "/schedule/", icon: <FiCalendar /> },
  { name: "Trucks", href: "/trucks/", icon: <FiTruck /> },
  { name: "Add Trucks", href: "/trucks/add-trucks", icon: <FiPlus /> },
  { name: "Packing List", href: "/about", icon: <FiInfo /> },
  { name: "Requests", href: "/requests/", icon: <FiFileText /> },
  { name: "Reports", href: "/reports/", icon: <FiBarChart2 /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { isAdmin, loading } = useAuth();
  const shouldDisable = !loading && !isAdmin;

  const { shouldHighlight } = useTutorial();

  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setIsOpen(false); // Close mobile menu when switching to desktop
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Listen for toggle event from header hamburger button
  useEffect(() => {
    const handleToggleSidebar = () => {
      console.log("Toggle sidebar event received");
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggleSidebar", handleToggleSidebar);
    return () =>
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
  }, []);

  const isActive = (href: string) => {
    const normalize = (path: string) => path.replace(/\/$/, "");
    return normalize(pathname) === normalize(href.replace(/\/$/, ""));
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isMobile && isOpen ? "mobile-open" : ""}`}
        style={{ background: "var(--primary-dark)" }}
      >
        <div className="sidebar-content">
          {/* Navigation Links */}
          <div>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".4rem",
                maxHeight: "100%",
              }}
            >
              {sidebarLinks.map((link) => {
                const isAddItem =
                  link.name.startsWith("Add") || link.name === "Packing List";
                return (
                  <TutorialHighlight
                    key={link.href}
                    isHighlighted={shouldHighlight(
                      `.sidebar-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`
                    )}
                    className={`sidebar-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-4 rounded-xl transition-all duration-200 group"
                      style={{
                        paddingLeft: isAddItem ? "3.5rem" : "1rem",
                        paddingRight: "1rem",
                        paddingTop: isAddItem ? "0.5rem" : "0.75rem",
                        paddingBottom: isAddItem ? "0.5rem" : "0.75rem",
                        background: isActive(link.href)
                          ? "var(--primary-light)"
                          : "transparent",
                        color: isActive(link.href)
                          ? "var(--secondary-dark)"
                          : "var(--primary-light)",
                        boxShadow: isActive(link.href)
                          ? "0 4px 16px rgba(255, 213, 134, 0.3)"
                          : undefined,
                        transform: isActive(link.href)
                          ? "scale(1.05)"
                          : undefined,
                        fontWeight: 600,
                        opacity:
                          link.name.startsWith("Add") && shouldDisable
                            ? 0.5
                            : 1,
                        cursor:
                          link.name.startsWith("Add") && shouldDisable
                            ? "not-allowed"
                            : "pointer",
                        border: isActive(link.href)
                          ? "2px solid var(--primary-light)"
                          : "2px solid transparent",
                      }}
                      tabIndex={
                        link.name.startsWith("Add") && shouldDisable ? -1 : 0
                      }
                      aria-disabled={
                        link.name.startsWith("Add") && shouldDisable
                      }
                      onClick={(e) => {
                        if (link.name.startsWith("Add") && shouldDisable)
                          e.preventDefault();
                        if (isMobile) closeSidebar();
                      }}
                      title={
                        link.name.startsWith("Add") && shouldDisable
                          ? "Admin only"
                          : link.name
                      }
                      onMouseEnter={(e) => {
                        if (
                          !isActive(link.href) &&
                          !(link.name.startsWith("Add") && shouldDisable)
                        ) {
                          e.currentTarget.style.background =
                            "var(--primary-light)";
                          e.currentTarget.style.color = "var(--secondary-dark)";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(link.href)) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--primary-light)";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      <span
                        className="transition-colors duration-200"
                        style={{
                          color: isActive(link.href)
                            ? "var(--secondary-dark)"
                            : "var(--primary-light)",
                          fontSize: isAddItem ? "1rem" : "1.25rem",
                        }}
                      >
                        {link.icon}
                      </span>
                      <span
                        className="font-semibold"
                        style={{
                          fontSize: isAddItem ? "0.875rem" : "1rem",
                        }}
                      >
                        {link.name}
                      </span>
                    </Link>
                  </TutorialHighlight>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
