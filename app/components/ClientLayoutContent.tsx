"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";
import { Footer } from "./Footer";
import Header from "./Header";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "./Sidebar";

interface ClientLayoutContentProps {
  children: ReactNode;
}

export const queryClient = new QueryClient();

export function ClientLayoutContent({ children }: ClientLayoutContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const noLayoutPaths = ["/login", "/set-password"];
  const isPublicPage = noLayoutPaths.includes(pathname);
  const isEmployeeSide = pathname.startsWith("/employee-side");

  useEffect(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get("type");
    const token = url.searchParams.get("token");

    if (type === "invite" && token && pathname === "/") {
      router.replace(`/set-password${window.location.search}`);
    }
  }, [router, pathname]);

  useEffect(() => {
    // Add data attribute to body for employee-side pages
    if (isEmployeeSide) {
      document.body.setAttribute("data-employee-side", "true");
    } else {
      document.body.removeAttribute("data-employee-side");
    }
  }, [isEmployeeSide]);

  if (isEmployeeSide) {
    return <>{children}</>;
  }

  if (isPublicPage) {
    return (
      <TutorialProvider>
        <div
          className="min-h-screen"
          style={{ background: "var(--background-light)" }}
        >
          {children}
        </div>
        <TutorialOverlay />
      </TutorialProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <div style={{ background: "var(--background-light)" }}>
          {/* Header - sticky */}
          <Header />

          {/* Main content area with sidebar and content */}
          <div className="flex" style={{ minHeight: "calc(100vh - 80px)" }}>
            {/* Sidebar - always rendered, handles its own visibility */}
            <Sidebar />

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-h-0">
              <main className="flex-1">
                <div className="main-content p-4 lg:p-8 lg:pt-6">
                  {children}
                </div>
              </main>

              {/* Footer */}
              <Footer />
            </div>
          </div>

          <TutorialOverlay />
        </div>
      </TutorialProvider>
    </QueryClientProvider>
  );
}
