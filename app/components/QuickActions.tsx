"use client";

import Link from "next/link";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "./TutorialHighlight";

export default function QuickActions() {
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
        <nav>
          {quickActionLinks.map((link, index) => {
            const selector = `.sidebar .TutorialHighlight:nth-child(${index + 1})`;
            const isHighlighted = shouldHighlight(selector);
            return (
              <TutorialHighlight
                key={index}
                isHighlighted={isHighlighted}
                className="button"
              >
                <Link href={link.href}>
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
