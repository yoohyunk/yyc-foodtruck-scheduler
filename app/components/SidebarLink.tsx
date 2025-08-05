"use client";

import React from "react";
import Link from "next/link";
import { NavLink } from "../types";
import { TutorialHighlight } from "./TutorialHighlight";

interface SidebarLinkProps {
  link: NavLink;
  isActive: (href: string) => boolean;
  shouldHighlight: (selector: string) => boolean;
  shouldDisable: boolean;
  onCloseSidebar: () => void;
  isMobile: boolean;
}

export const SidebarLink = React.memo(function SidebarLink({
  link,
  isActive,
  shouldHighlight,
  shouldDisable,
  onCloseSidebar,
  isMobile,
}: SidebarLinkProps) {
  const isAddItem = link.name.startsWith("Add");
  const isActiveLink = isActive(link.href);

  return (
    <TutorialHighlight
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
          background: isActiveLink ? "var(--primary-dark)" : "transparent",
          color: isActiveLink ? "var(--primary-light)" : "var(--primary-dark)",
          boxShadow: isActiveLink
            ? "0 4px 16px rgba(255, 213, 134, 0.3)"
            : undefined,
          transform: isActiveLink ? "scale(1.05)" : undefined,
          fontWeight: 600,
          opacity: isAddItem && shouldDisable ? 0.5 : 1,
          cursor: isAddItem && shouldDisable ? "not-allowed" : "pointer",
          border: isActiveLink
            ? "2px solid var(--primary-dark)"
            : "2px solid transparent",
        }}
        tabIndex={isAddItem && shouldDisable ? -1 : 0}
        aria-disabled={isAddItem && shouldDisable}
        onClick={(e) => {
          console.log(
            "SidebarLink clicked:",
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
            console.log("Calling onCloseSidebar from SidebarLink");
            onCloseSidebar();
          }
        }}
        title={isAddItem && shouldDisable ? "Admin only" : link.name}
        onMouseEnter={(e) => {
          if (!isActiveLink && !(isAddItem && shouldDisable)) {
            e.currentTarget.style.background = "var(--primary-dark)";
            e.currentTarget.style.color = "var(--primary-light)";
            e.currentTarget.style.transform = "scale(1.02)";
            // Update icon color on hover
            const iconSpan = e.currentTarget.querySelector("span:first-child");
            if (iconSpan) {
              (iconSpan as HTMLElement).style.color = "var(--primary-light)";
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isActiveLink) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--primary-dark)";
            e.currentTarget.style.transform = "scale(1)";
            // Reset icon color when not hovering
            const iconSpan = e.currentTarget.querySelector("span:first-child");
            if (iconSpan) {
              (iconSpan as HTMLElement).style.color = "var(--primary-dark)";
            }
          }
        }}
      >
        <span
          className="transition-colors duration-200"
          style={{
            color: isActiveLink
              ? "var(--primary-light)"
              : "var(--primary-dark)",
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
});
