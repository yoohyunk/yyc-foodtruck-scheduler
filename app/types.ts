import { ReactNode } from "react";
import { Tables } from "@/database.types";

// Supabase table types
export type Event = Tables<"events"> & {
  addresses?: Tables<"addresses">;
};
export type Employee = Tables<"employees"> & {
  addresses?: Tables<"addresses">;
};
export type Truck = Tables<"trucks">;
export type TruckAssignment = Tables<"truck_assignment">;
export type Address = Tables<"addresses">;

export interface EventFormData {
  name: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  requiredServers: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  trucks: string[];
  isPrepaid: boolean;
  // Address fields
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: string;
  longitude?: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  selector: string;
  position: "top" | "bottom" | "left" | "right";
}

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}
