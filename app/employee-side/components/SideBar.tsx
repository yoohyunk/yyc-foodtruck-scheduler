"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiTruck,
  FiUser,
} from "react-icons/fi";

export default function SideBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Time Off",
      href: "/employee-side/time-off",
      icon: <FiCalendar />,
    },
    {
      label: "Schedule",
      href: "/employee-side/schedule",
      icon: <FiClock />,
    },
    {
      label: "Pay Report",
      href: "/employee-side/pay-report",
      icon: <FiDollarSign />,
    },
    {
      label: "About Truck",
      href: "/employee-side/about-truck",
      icon: <FiTruck />,
    },
    {
      label: "Profile",
      href: "/employee-side/profile",
      icon: <FiUser />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="group bg-gradient-to-b from-blue-700 to-blue-600 text-white transition-all duration-300 hover:w-64 w-20 overflow-hidden shadow-lg">
        <div className="p-4">
          {/* Logo or Title */}
          <h1 className="text-lg font-bold tracking-wide group-hover:block hidden">
            Employee Panel
          </h1>
        </div>

        <nav className="flex flex-col space-y-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-200 
                ${
                  pathname === item.href
                    ? "bg-white text-blue-700 font-semibold"
                    : "hover:bg-blue-500"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="group-hover:inline-block hidden text-sm transition-opacity duration-200">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
