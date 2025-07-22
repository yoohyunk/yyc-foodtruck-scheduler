"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiUser,
  FiHome,
  FiMail,
  FiUsers,
  FiList,
} from "react-icons/fi";

export default function SideBar() {
  const pathname = usePathname();

  const sidebarSections = [
    {
      title: "General",
      items: [
        {
          label: "Dashboard",
          href: "/employee-side",
          icon: <FiHome />,
        },
        {
          label: "Schedule",
          href: "/employee-side/schedule",
          icon: <FiCalendar />,
        },
        {
          label: "Events",
          href: "/employee-side/events",
          icon: <FiCalendar />,
        },
        {
          label: "Time Off",
          href: "/employee-side/time-off",
          icon: <FiClock />,
          subItems: [
            {
              label: "Request Time Off",
              href: "/employee-side/time-off-request",
              icon: "+",
            },
          ],
        },
      ],
    },
    {
      title: "My Info",
      items: [
        {
          label: "My Profile",
          href: "/employee-side/profile",
          icon: <FiUser />,
        },
        {
          label: "Pay Report",
          href: "/employee-side/pay-report",
          icon: <FiDollarSign />,
        },
        {
          label: "Packing List",
          href: "/employee-side/packing-list",
          icon: <FiList />,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Coworkers",
          href: "/employee-side/coworkers",
          icon: <FiUsers />,
        },
        {
          label: "Contact",
          href: "/contact",
          icon: <FiMail />,
        },
      ],
    },
  ];

  return (
    <div
      className="employee-sidebar text-white shadow-lg w-64 h-screen"
      style={{ backgroundColor: "var(--primary-dark)" }}
    >
      <div className="flex flex-col h-full pl-8 pt-4">
        {/* Logo section */}
        <div>
          <Link href="/employee-side" className="flex items-center">
            <Image
              src="/yyctrucks.jpg"
              alt="YYC Logo"
              width={48}
              height={48}
              className="logo-img rounded"
            />
            <span className="ml-2 text-xl font-bold whitespace-nowrap">
              YYC Food Trucks
            </span>
          </Link>
        </div>

        {/* Navigation section  */}
        <div className="flex-1 flex flex-col justify-center">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {/* Section Title */}
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider px-6 mb-3 mt-6">
                {section.title}
              </h3>

              {/* Divider */}
              <div className="border-t border-white/20 mx-6 mb-4"></div>

              {/* Navigation Items */}
              <nav className="flex flex-col space-y-2">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center px-6 py-3 rounded-xl 
                      ${
                        pathname === item.href
                          ? "bg-[var(--primary-light)] text-[var(--secondary-dark)] font-bold shadow"
                          : "hover:bg-[var(--primary-light)] hover:text-[var(--secondary-dark)] text-[var(--primary-light)]"
                      }
                      group
                    `}
                  >
                    <div className="flex items-center w-full gap-4">
                      <span className="flex-shrink-0 ml-auto mr-auto">
                        {item.icon}
                      </span>
                      <span className="text-lg font-semibold">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
