import "./globals.css";
import AuthGuard from "./components/AuthGuard";

import { ReactNode, ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientLayoutContent } from "./components/ClientLayoutContent";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YYC Foodtruck Scheduler",
  description:
    "A scheduling and workforce-management platform for YYC food truck operations",
  icons: {
    icon: "/favicon.ico",
  },
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
          <AuthGuard>
            {/* This component will render its children only if the user is authenticated. */}
            {/* If the user is not authenticated, it redirects to the login page. */}
            <ClientLayoutContent>{children}</ClientLayoutContent>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
