import "../globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { TutorialProvider, TutorialOverlay } from "@/app/tutorial";
import Header from "./components/Header";
import SideBar from "./components/SideBar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TutorialProvider>
        <Header />
        <SideBar>
          <main className="container mx-auto px-4 py-6">{children}</main>
        </SideBar>
        <TutorialOverlay />
      </TutorialProvider>
    </AuthProvider>
  );
}
