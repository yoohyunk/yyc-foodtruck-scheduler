import "./globals.css";

import { ReactNode, ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientLayoutContent } from "./components/ClientLayoutContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YYC Foodtruck Scheduler",
  description:
    "A scheduling and workforce-management platform for YYC food truck operations",
  icons: {
    icon: '/favicon.ico',
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
        <ClientLayoutContent>{children}</ClientLayoutContent>
      </body>
    </html>
  );
}
