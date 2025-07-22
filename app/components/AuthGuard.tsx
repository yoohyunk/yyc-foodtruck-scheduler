"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";

const publicRoutes = ["/login", "/set-password", "/forgotpassword"];

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      if (loading) return;

      if (!user && !publicRoutes.includes(pathname)) {
        router.replace("/login");
        return;
      }

      if (user && !publicRoutes.includes(pathname)) {
        try {
          // Get the employee record for the current user
          const employee = await employeesApi.getEmployeeByUserId(user.id);

          if (employee) {
            if (employee.employee_type === "Admin") {
              // Admin should NOT access /employee-side
              if (pathname.startsWith("/employee-side")) {
                router.replace("/");
                return;
              }
            } else {
              // Employee should ONLY access /employee-side
              if (!pathname.startsWith("/employee-side")) {
                router.replace("/employee-side");
                return;
              }
            }
          } else {
            // No employee record found
            console.log(
              "No employee record found, redirecting to /set-up-employee-info"
            );
            router.replace("/set-up-employee-info");
            return;
          }
        } catch {
          router.replace("/error");
          return;
        }
      }

      setCheckingRole(false);
    };

    verifyAndRedirect();
  }, [user, loading, pathname, router]);

  if (loading || checkingRole) return null;

  return <>{children}</>;
}
