"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";
import { Footer } from "./Footer";
import Header from "./Header";
import QuickActions from "./QuickActions";

interface ClientLayoutContentProps {
  children: ReactNode;
}

export function ClientLayoutContent({ children }: ClientLayoutContentProps) {
  return (
    <AuthProvider>
      <TutorialProvider>
        <Header />

        <main className="container dashboard-grid flex-grow">
          <QuickActions />

          <div className="main-content p-4">{children}</div>
        </main>

        <Footer />
        <TutorialOverlay />
      </TutorialProvider>
    </AuthProvider>
  );
}
