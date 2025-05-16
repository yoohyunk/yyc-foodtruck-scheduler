import "./globals.css";
import { AuthProvider } from "../Auth/auth-context";
import { FiCalendar, FiUsers, FiTruck, FiLogOut } from "react-icons/fi";
import { GiFoodTruck } from "react-icons/gi";
import { ReactNode, ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YYC Food Trucks",
  description: "Employee scheduling and management system",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps): ReactElement {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
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
                <Link href="/employees/" className="nav-link">
                  <span className="nav-icon">👥</span>
                  Employees
                </Link>
                <Link href="/events/" className="nav-link">
                  <span className="nav-icon">📅</span>
                  Events
                </Link>
                <Link href="/schedule/" className="nav-link">
                  <span className="nav-icon">📊</span>
                  Schedule
                </Link>
                <Link href="/employees/newEmployee/" className="nav-link">
                  <span className="nav-icon">➕</span>
                  New Employee
                </Link>
                <Link href="/events/newEvent/" className="nav-link">
                  <span className="nav-icon">➕</span>
                  New Event
                </Link>
              </div>
            </nav>
          </header>

          <main className="container dashboard-grid">
            <aside className="sidebar bg-gray-100 p-3 shadow-md">
              <h3 className="text-md font-semibold mb-3">Quick Actions</h3>
              <nav className="space-y-2">
                <Link
                  href="/schedule/new"
                  className="button w-full text-center bg-blue-500 text-white py-1 rounded-lg hover:bg-blue-600"
                >
                  + New Shift
                </Link>
                <Link
                  href="/employees/newEmployee"
                  className="button w-full text-center bg-blue-500 text-white py-1 rounded-lg hover:bg-blue-600"
                >
                  + Add Staff
                </Link>
                <Link
                  href="/events/newEvent"
                  className="button w-full text-center bg-blue-500 text-white py-1 rounded-lg hover:bg-blue-600"
                >
                  + Create Event
                </Link>
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
        </AuthProvider>
      </body>
    </html>
  );
}
