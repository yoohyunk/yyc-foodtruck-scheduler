import "./globals.css";

import { AuthProvider } from "@/contexts/AuthContext";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";

import { ReactNode, ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Footer } from "./components/Footer";
import Header from "./components/Header";
import QuickActions from "./components/QuickActions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YYC Foodtruck Scheduler",
  description:
    "A scheduling and workforce-management platform for YYC food truck operations",
};

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
            <Header />

            <main className="container dashboard-grid flex-grow">
              <QuickActions />

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
