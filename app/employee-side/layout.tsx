import React from "react";
import SideBar from "./components/SideBar";
import Header from "./components/Header";
import { TutorialProvider } from "../tutorial/TutorialContext";
import { AuthProvider } from "../../contexts/AuthContext";
import { TutorialOverlay } from "../tutorial/components/TutorialOverlay";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TutorialProvider>
        <div className="flex min-h-screen" data-employee-side="true">
          <aside
            aria-label="Employee sidebar"
            className="hidden lg:block w-64 bg-primary-dark pt-6 sticky top-0 h-screen overflow-y-auto"
          >
            <SideBar />
          </aside>
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="employee-page-content flex-1">{children}</main>
          </div>
        </div>
        <TutorialOverlay />
      </TutorialProvider>
    </AuthProvider>
  );
}
