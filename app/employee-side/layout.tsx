"use client";

import { ReactNode } from "react";
import EmployeeHeader from "./components/Header";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";

interface EmployeeLayoutProps {
  children: ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  return (
    <TutorialProvider>
      <EmployeeHeader />
      <main className="container flex-grow">
        <div className="main-content p-4">{children}</div>
      </main>
      <TutorialOverlay />
    </TutorialProvider>
  );
}
