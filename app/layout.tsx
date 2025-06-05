import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";
import { FiLogOut } from "react-icons/fi";
import { ReactNode, ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { NavLink } from "./types";
import { Footer } from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YYC Foodtruck Scheduler",
  description:
    "A scheduling and workforce-management platform for YYC food truck operations",
};

const mainNavLinks: NavLink[] = [
  { name: "Employees", href: "/employees/", icon: "👥" },
  { name: "Events", href: "/events/", icon: "📅" },
  { name: "Schedule", href: "/schedule/", icon: "📊" },
  { name: "New Employee", href: "/employees/newEmployee/", icon: "➕" },
  { name: "New Event", href: "/events/newEvent/", icon: "➕" },
  { name: "Login", href: "/login", icon: "🔑" },
];

const quickActionLinks: NavLink[] = [
  { name: "New Shift", href: "/schedule/new", icon: "+" },
  { name: "Add Staff", href: "/employees/newEmployee", icon: "+" },
  { name: "Create Event", href: "/events/newEvent", icon: "+" },
];

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <TutorialProvider>
            <header className="header">
              <nav className="nav-container">
                <Link href="/" className="logo">
                  <Image
                    src="/yyctrucks.jpg"
                    alt="YYC Logo"
                    width={64}
                    height={64}
                    className="logo-img"
                  />
                  <span className="logo-text">YYC Food Trucks</span>
                </Link>
                <div className="nav-links">
                  {mainNavLinks.map((link, index) => (
                    <Link key={index} href={link.href} className="nav-link">
                      <span className="nav-icon">{link.icon}</span>
                      {link.name}
                    </Link>
                  ))}
                </div>
              </nav>
            </header>

            <main className="container dashboard-grid flex-grow">
              <aside className="sidebar bg-gray-100 p-3 shadow-md">
                <h3 className="text-md font-semibold mb-6">Quick Actions</h3>
                <nav>
                  {quickActionLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="button"
                    >
                      <span>{link.icon}</span> {link.name}
                    </Link>
                  ))}
                </nav>

                <div className="mt-4 pt-3 border-t border-gray-300">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    <FiLogOut /> Logout
                  </Link>
                </div>
              </aside>

              <div className="main-content p-4">{children}</div>
            </main>

            <Footer />
            <TutorialOverlay />
          </TutorialProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
