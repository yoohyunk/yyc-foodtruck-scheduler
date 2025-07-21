"use client";

import React, { useState, useEffect } from "react";
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
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarSection } from "./SidebarSection";
import { SidebarLink } from "./SidebarLink";

// Sidebar sections with nested navigation links
const sidebarSections = [
  {
    name: "Employees",
    icon: <FiUsers />,
    mainHref: "/employees/",
    links: [
      {
        name: "Add Employee",
        href: "/employees/newEmployee",
        icon: <FiPlus />,
      },
      {
        name: "Pending Employees",
        href: "/pending-employees",
        icon: <FiUsers />,
      },
    ],
  },
  {
    name: "Events",
    icon: <FaRegCalendarAlt />,
    mainHref: "/events/",
    links: [{ name: "Add Event", href: "/events/newEvent", icon: <FiPlus /> }],
  },
  {
    name: "Schedule",
    icon: <FiCalendar />,
    mainHref: "/schedule/",
    links: [{ name: "Add Shift", href: "/schedule/new", icon: <FiPlus /> }],
  },
  {
    name: "Trucks",
    icon: <FiTruck />,
    mainHref: "/trucks/",
    links: [
      { name: "Add Trucks", href: "/trucks/add-trucks", icon: <FiPlus /> },
    ],
  },
];

// Simple navigation links (non-dropdown)
const simpleLinks: NavLink[] = [
  { name: "Requests", href: "/requests/", icon: <FiFileText /> },
  { name: "Reports", href: "/reports/", icon: <FiBarChart2 /> },
  { name: "Packing List", href: "/about", icon: <FiInfo /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
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
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggleSidebar", handleToggleSidebar);
    return () =>
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
  }, []);

  const isActive = React.useCallback(
    (href: string) => {
      const normalize = (path: string) => path.replace(/\/$/, "");
      return normalize(pathname) === normalize(href.replace(/\/$/, ""));
    },
    [pathname]
  );

  const closeSidebar = () => setIsOpen(false);

  const toggleSection = React.useCallback((sectionName: string) => {
    setExpandedSections((prev) => {
      const isCurrentlyExpanded = prev.includes(sectionName);
      if (isCurrentlyExpanded) {
        return prev.filter((name) => name !== sectionName);
      } else {
        return [...prev, sectionName];
      }
    });
  }, []);

  const isSectionExpanded = (sectionName: string) => {
    return expandedSections.includes(sectionName);
  };

  const hasActiveLinkInSection = React.useCallback(
    (section: { links: NavLink[]; mainHref: string }) => {
      return isActive(section.mainHref);
    },
    [isActive]
  );

  useEffect(() => {
    const newExpandedSections: string[] = [];

    sidebarSections.forEach((section) => {
      if (
        isActive(section.mainHref) ||
        section.links.some((link) => isActive(link.href))
      ) {
        newExpandedSections.push(section.name);
      }
    });

    setExpandedSections((prev) => {
      if (prev.length !== newExpandedSections.length)
        return newExpandedSections;
      return prev.every((section) => newExpandedSections.includes(section)) &&
        newExpandedSections.every((section) => prev.includes(section))
        ? prev
        : newExpandedSections;
    });
  }, [pathname, isActive]);

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
          {/* Navigation Sections */}
          <div>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".4rem",
                maxHeight: "100%",
              }}
            >
              <SidebarLink
                link={{ name: "Dashboard", href: "/", icon: <FiHome /> }}
                isActive={isActive}
                shouldHighlight={shouldHighlight}
                shouldDisable={shouldDisable}
                onCloseSidebar={closeSidebar}
                isMobile={isMobile}
              />
              {/* Dropdown Sections */}
              {sidebarSections.map((section) => (
                <SidebarSection
                  key={section.name}
                  section={section}
                  isExpanded={isSectionExpanded(section.name)}
                  hasActive={hasActiveLinkInSection(section)}
                  onToggle={() => toggleSection(section.name)}
                  onCloseSidebar={closeSidebar}
                  isActive={isActive}
                  shouldHighlight={shouldHighlight}
                  shouldDisable={shouldDisable}
                  isMobile={isMobile}
                  disableAnimations={!isAdmin}
                />
              ))}

              {/* Simple Links */}
              {simpleLinks.map((link) => (
                <SidebarLink
                  key={link.href}
                  link={link}
                  isActive={isActive}
                  shouldHighlight={shouldHighlight}
                  shouldDisable={shouldDisable}
                  onCloseSidebar={closeSidebar}
                  isMobile={isMobile}
                />
              ))}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
