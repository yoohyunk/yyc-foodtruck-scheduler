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
export type EmployeeAvailability = Tables<"employee_availability">;
export type Truck = Tables<"trucks">;
export type TruckAssignment = Tables<"truck_assignment">;
export type TruckAssignmentCreate = {
  id: string;
  truck_id: string;
  driver_id: string | null;
  event_id: string | null;
  start_time: string;
  end_time: string;
};
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
  [key: string]: unknown;
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
  availability?: string[];
  // Address fields for AddressForm
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: string;
  longitude?: string;
  [key: string]: unknown;
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
  id: string;
  employee_id: string | null;
  start_datetime: string;
  end_datetime: string;
  reason: string | null;
  type: string;
  status: string;
  created_at: string;
}

export interface TimeOffRequestFormData {
  start_datetime: string;
  end_datetime: string;
  reason: string;
  type: string;
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

// Utility functions for truck type color coding
export const getTruckTypeColor = (type: string): string => {
  switch (type) {
    case "Food Truck":
      return "border-orange-300 bg-orange-50";
    case "Beverage Truck":
      return "border-blue-300 bg-blue-50";
    case "Dessert Truck":
      return "border-pink-300 bg-pink-50";
    case "Holiday Truck":
      return "border-purple-300 bg-purple-50";
    default:
      return "border-gray-300 bg-gray-50";
  }
};

export const getTruckTypeBadge = (type: string): string => {
  switch (type) {
    case "Food Truck":
      return "bg-orange-100 text-orange-800";
    case "Beverage Truck":
      return "bg-blue-100 text-blue-800";
    case "Dessert Truck":
      return "bg-pink-100 text-pink-800";
    case "Holiday Truck":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Utility function to get truck border colors based on truck type
export const getTruckBorderColor = (type: string): string => {
  switch (type) {
    case "Food Truck":
      return "#b36a5e"; // red color (you mentioned red for food truck)
    case "Beverage Truck":
      return "#fff5cd"; // yellow color from schedule page (var(--primary-light))
    case "Dessert Truck":
      return "#e78f81"; // pink color from pending button (var(--accent))
    case "Holiday Truck":
      return "#dc2626"; // purple color to match the badge styling
    default:
      return "#6b7280"; // default gray
  }
};
