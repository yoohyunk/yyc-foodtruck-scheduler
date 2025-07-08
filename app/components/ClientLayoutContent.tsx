"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";
import { Footer } from "./Footer";
import Header from "./Header";
import QuickActions from "./QuickActions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ClientLayoutContentProps {
  children: ReactNode;
}

export const queryClient = new QueryClient();

export function ClientLayoutContent({ children }: ClientLayoutContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const noLayoutPaths = ["/login", "/set-password"];
  const isPublicPage = noLayoutPaths.includes(pathname);

  useEffect(() => {
    const url = new URL(window.location.href);
    const type = url.searchParams.get("type");
    const token = url.searchParams.get("token");

    if (type === "invite" && token && pathname === "/") {
      router.replace(`/set-password${window.location.search}`);
    }
  }, [pathname, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <Header />
        <main className="container dashboard-grid flex-grow">
          <QuickActions />
          <div className="main-content p-4">{children}</div>
        </main>
        <Footer />
        <TutorialOverlay />
      </TutorialProvider>
    </QueryClientProvider>
  );
}
