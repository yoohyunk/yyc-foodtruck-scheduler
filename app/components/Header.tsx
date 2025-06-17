"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { FiLogOut, FiUsers, FiCalendar, FiPlus, FiTruck, FiHome } from "react-icons/fi";
import { FaRegCalendarAlt } from "react-icons/fa";
import { NavLink } from "../types";

const mainNavLinks: NavLink[] = [
  { name: "Employees", href: "/employees/", icon: <FiUsers /> },
  { name: "Events", href: "/events/", icon: <FaRegCalendarAlt /> },
  { name: "Schedule", href: "/schedule/", icon: <FiCalendar /> },
  { name: "New Employee", href: "/employees/newEmployee/", icon: <FiPlus /> },
  { name: "New Event", href: "/events/newEvent", icon: <FiPlus /> },
];

export default function Header(): React.ReactElement {
  const { user, signOut } = useAuth();

  return (
    <header className="header">
      <nav className="nav-container flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="logo flex items-center">
            <Image
              src="/yyctrucks.jpg"
              alt="YYC Logo"
              width={64}
              height={64}
              className="logo-img rounded"
            />
            <span className="ml-2 text-xl font-bold">YYC Food Trucks</span>
          </Link>
          <div className="nav-links ml-6 flex space-x-4">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link flex items-center space-x-1"
              >
                <span className="nav-icon">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
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
      </nav>
    </header>
  );
}
