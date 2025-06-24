"use client";
import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Change path if needed

const publicRoutes = ["/login", "/set-password"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;

  // Allow access to public routes or if user is authenticated
  if (publicRoutes.includes(pathname) || user) {
    return <>{children}</>;
  }

  // Otherwise, nothing is rendered while redirecting
  return null;
}
