"use client";

import React from "react";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { NavLink } from "../types";
import { TutorialHighlight } from "./TutorialHighlight";

interface SidebarSectionProps {
  section: {
    name: string;
    icon: React.ReactNode;
    mainHref: string;
    links: NavLink[];
  };
  isExpanded: boolean;
  hasActive: boolean;
  onToggle: () => void;
  onCloseSidebar: () => void;
  isActive: (href: string) => boolean;
  shouldHighlight: (selector: string) => boolean;
  shouldDisable: boolean;
  isMobile: boolean;
  disableAnimations?: boolean;
}

export const SidebarSection = React.memo(function SidebarSection({
  section,
  isExpanded,
  hasActive,
  onToggle,
  onCloseSidebar,
  isActive,
  shouldHighlight,
  shouldDisable,
  isMobile,
  disableAnimations = false,
}: SidebarSectionProps) {
  return (
    <div>
      {/* Section Header */}
      <div
        className="flex items-center justify-between w-full rounded-xl transition-all duration-200 group"
        style={{
          padding: "0.75rem 1rem",
          background: hasActive ? "var(--primary-dark)" : "transparent",
          color: hasActive ? "var(--primary-light)" : "var(--primary-dark)",
          fontWeight: 600,
          border: hasActive
            ? "2px solid var(--primary-dark)"
            : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!hasActive) {
            e.currentTarget.style.background = "var(--primary-dark)";
            e.currentTarget.style.color = "var(--primary-light)";
          }
        }}
        onMouseLeave={(e) => {
          if (!hasActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--primary-dark)";
          }
        }}
      >
        <Link
          href={section.mainHref}
          className="flex items-center gap-4 flex-1"
          onClick={() => {
            console.log(
              "SidebarSection main link clicked:",
              section.name,
              "isMobile:",
              isMobile,
              "disableAnimations:",
              disableAnimations
            );
            if (!disableAnimations) {
              onToggle();
              if (isMobile) {
                console.log(
                  "Calling onCloseSidebar from SidebarSection main link"
                );
                onCloseSidebar();
              }
            }
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>{section.icon}</span>
          <span style={{ fontSize: "1rem" }}>{section.name}</span>
        </Link>
        <button
          onClick={disableAnimations ? undefined : onToggle}
          disabled={disableAnimations}
          className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
        >
          <span
            style={{
              fontSize: "1rem",
              ...(disableAnimations
                ? {}
                : {
                    transition: "transform 0.15s ease-out",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }),
            }}
          >
            <FiChevronRight />
          </span>
        </button>
      </div>

      {/* Section Links */}
      {!disableAnimations && (
        <div
          style={{
            marginLeft: "1rem",
            marginTop: "0.25rem",
            overflow: "hidden",
            transition: "all 0.15s ease-out",
            maxHeight: isExpanded ? "200px" : "0px",
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? "translateY(0)" : "translateY(-5px)",
          }}
        >
          {section.links.map((link) => {
            const isAddItem = link.name.startsWith("Add");
            const isActiveLink = isActive(link.href);
            return (
              <TutorialHighlight
                key={link.href}
                isHighlighted={shouldHighlight(
                  `.sidebar-nav-${link.name.toLowerCase().replace(/\s/g, "-")}`
                )}
                className={`sidebar-nav-${link.name
                  .toLowerCase()
                  .replace(/\s/g, "-")}`}
              >
                <Link
                  href={link.href}
                  className="flex items-center gap-4 rounded-xl transition-all duration-200 group"
                  style={{
                    paddingLeft: "2.5rem",
                    paddingRight: "1rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                    background: isActiveLink
                      ? "var(--primary-dark)"
                      : "transparent",
                    color: isActiveLink
                      ? "var(--primary-light)"
                      : "var(--primary-dark)",
                    boxShadow: isActiveLink
                      ? "0 4px 16px rgba(255, 213, 134, 0.3)"
                      : undefined,
                    transform: isActiveLink ? "scale(1.05)" : undefined,
                    fontWeight: 600,
                    opacity: isAddItem && shouldDisable ? 0.5 : 1,
                    cursor:
                      isAddItem && shouldDisable ? "not-allowed" : "pointer",
                    border: isActiveLink
                      ? "2px solid var(--primary-dark)"
                      : "2px solid transparent",
                  }}
                  tabIndex={isAddItem && shouldDisable ? -1 : 0}
                  aria-disabled={isAddItem && shouldDisable}
                  onClick={(e) => {
                    console.log(
                      "SidebarSection nested link clicked:",
                      link.name,
                      "isMobile:",
                      isMobile,
                      "isAddItem:",
                      isAddItem,
                      "shouldDisable:",
                      shouldDisable
                    );
                    if (isAddItem && shouldDisable) e.preventDefault();
                    if (isMobile) {
                      console.log(
                        "Calling onCloseSidebar from SidebarSection nested link"
                      );
                      onCloseSidebar();
                    }
                  }}
                  title={isAddItem && shouldDisable ? "Admin only" : link.name}
                  onMouseEnter={(e) => {
                    if (!isActiveLink && !(isAddItem && shouldDisable)) {
                      e.currentTarget.style.background = "var(--primary-dark)";
                      e.currentTarget.style.color = "var(--primary-light)";
                      e.currentTarget.style.transform = "scale(1.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveLink) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--primary-dark)";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                >
                  <span
                    className="transition-colors duration-200"
                    style={{
                      color: isActiveLink
                        ? "var(--secondary-dark)"
                        : "var(--primary-light)",
                      fontSize: "1rem",
                    }}
                  >
                    {link.icon}
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: "0.875rem",
                    }}
                  >
                    {link.name}
                  </span>
                </Link>
              </TutorialHighlight>
            );
          })}
        </div>
      )}
    </div>
  );
});
