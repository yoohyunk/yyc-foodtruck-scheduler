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
          background: isActiveLink ? "var(--primary-light)" : "transparent",
          color: isActiveLink
            ? "var(--secondary-dark)"
            : "var(--primary-light)",
          boxShadow: isActiveLink
            ? "0 4px 16px rgba(255, 213, 134, 0.3)"
            : undefined,
          transform: isActiveLink ? "scale(1.05)" : undefined,
          fontWeight: 600,
          opacity: isAddItem && shouldDisable ? 0.5 : 1,
          cursor: isAddItem && shouldDisable ? "not-allowed" : "pointer",
          border: isActiveLink
            ? "2px solid var(--primary-light)"
            : "2px solid transparent",
        }}
        tabIndex={isAddItem && shouldDisable ? -1 : 0}
        aria-disabled={isAddItem && shouldDisable}
        onClick={(e) => {
          if (isAddItem && shouldDisable) e.preventDefault();
          if (isMobile) onCloseSidebar();
        }}
        title={isAddItem && shouldDisable ? "Admin only" : link.name}
        onMouseEnter={(e) => {
          if (!isActiveLink && !(isAddItem && shouldDisable)) {
            e.currentTarget.style.background = "var(--primary-light)";
            e.currentTarget.style.color = "var(--secondary-dark)";
            e.currentTarget.style.transform = "scale(1.02)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActiveLink) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--primary-light)";
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
