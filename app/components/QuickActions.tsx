"use client";

import Link from "next/link";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";
import { useAuth } from "@/contexts/AuthContext";

export default function QuickActions() {
  const { isAdmin, loading } = useAuth();
  // Only disable after loading is false and not admin
  const shouldDisable = !loading && !isAdmin;
  const quickActionLinks = [
    { name: "New Shift", href: "/schedule/new", icon: "+" },
    { name: "Add Staff", href: "/employees/newEmployee", icon: "+" },
    { name: "Create Event", href: "/events/newEvent", icon: "+" },
  ];

  const { shouldHighlight } = useTutorial();

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".sidebar")}
      className="sidebar hidden xl:block"
    >
      <aside className="sidebar bg-gray-100 p-3 shadow-md">
        <h3 className="text-md font-semibold mb-6">Quick Actions</h3>
        <nav className="flex flex-col gap-4">
          {quickActionLinks.map((link, index) => {
            const selector = `.sidebar .TutorialHighlight:nth-child(${index + 1})`;
            const isHighlighted = shouldHighlight(selector);
            return (
              <TutorialHighlight
                key={index}
                isHighlighted={isHighlighted}
                className="TutorialHighlight"
              >
                <Link
                  href={link.href}
                  tabIndex={shouldDisable ? -1 : 0}
                  aria-disabled={shouldDisable}
                  className={`button px-4 py-2 rounded bg-primary-dark text-white font-semibold shadow hover:bg-primary-medium transition-colors duration-150 ${shouldDisable ? "opacity-60 cursor-not-allowed" : ""}`}
                  onClick={(e) => {
                    if (shouldDisable) e.preventDefault();
                  }}
                  title={shouldDisable ? "Admin only" : link.name}
                >
                  <span>{link.icon}</span> {link.name}
                </Link>
              </TutorialHighlight>
            );
          })}
        </nav>
      </aside>
    </TutorialHighlight>
  );
}
