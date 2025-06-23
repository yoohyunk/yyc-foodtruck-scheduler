import { ReactNode } from "react";
import { Tables } from "@/database.types";

// Supabase table types
export type Event = Tables<"events"> & {
  addresses?: Tables<"addresses">;
};
export type Employee = Tables<"employees"> & {
  addresses?: Tables<"addresses">;
  currentWage?: number;
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

export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  address: string;
  role: string;
  email: string;
  phone: string;
  wage: string;
  isAvailable: boolean;
  availability: string[];
  // Address fields for AddressForm
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

export interface NavLink {
  name: string;
  href: string;
  icon: React.ReactElement;
}

export interface TimeOffRequest {
  type: string;
  date: string;
  duration: string;
  reason: string;
  status: string;
}

export interface TimeOffRequestFormData {
  date: string;
  type: string;
  duration: string;
  reason: string;
}

export interface HomePageEvent {
  title: string;
  startTime: string;
  location: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
