"use client";

import React, { ReactElement } from "react";
import {
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  href: string;
  color: string;
  shouldHighlight: (selector: string) => boolean;
  highlightClass: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  description,
  icon,
  href,
  color,
  shouldHighlight,
  highlightClass,
}) => (
  <TutorialHighlight isHighlighted={shouldHighlight(highlightClass)}>
    <Link href={href} className="block">
      <div
        className={`employee-card bg-white p-6 rounded shadow hover:shadow-lg transition-shadow duration-200 ${color}`}
      >
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-primary-light mr-4">
            <div className="w-6 h-6 text-primary-dark">{icon}</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center text-primary-dark font-medium text-sm">
          <span>View Report</span>
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  </TutorialHighlight>
);

export default function ReportsPage(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();

  const reports = [
    {
      title: "Employee Availability Report",
      description:
        "View all current assignments, time off requests, and availability for each employee for the selected week.",
      icon: <FiUsers />,
      href: "/reports/employee-availability",
      color: "hover:border-blue-300",
      highlightClass: ".employee-availability-report",
    },
    {
      title: "Truck Availability Report",
      description:
        "See events booked for each truck and their availability status for the selected week.",
      icon: <FiTruck />,
      href: "/reports/truck-availability",
      color: "hover:border-orange-300",
      highlightClass: ".truck-availability-report",
    },
    {
      title: "Payroll Report",
      description:
        "Calculate total employee hours and wages for the selected pay period (1st-15th or 16th-end of month).",
      icon: <FiDollarSign />,
      href: "/reports/payroll",
      color: "hover:border-green-300",
      highlightClass: ".payroll-report",
    },
    {
      title: "Time Off Requests Report",
      description:
        "View detailed time off requests for specific employees with filtering and status tracking.",
      icon: <FiCalendar />,
      href: "/reports/time-off-requests",
      color: "hover:border-purple-300",
      highlightClass: ".time-off-requests-report",
    },
  ];

  if (!isAdmin) {
    return (
      <div className="reports-page">
        <h2 className="text-2xl text-primary-dark mb-4">Reports</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="mb-6">
        <h2 className="text-2xl text-primary-dark mb-2">Reports Dashboard</h2>
        <p className="text-gray-600">
          Generate comprehensive reports for business operations and employee
          management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <ReportCard
            key={index}
            title={report.title}
            description={report.description}
            icon={report.icon}
            href={report.href}
            color={report.color}
            shouldHighlight={shouldHighlight}
            highlightClass={report.highlightClass}
          />
        ))}
      </div>
    </div>
  );
}
