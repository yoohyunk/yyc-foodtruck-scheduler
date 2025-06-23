import { ReactNode } from "react";
import { Database } from "../database.types";

// Supabase table types
export type Employee = Database["public"]["Tables"]["employees"]["Row"] & {
  address?: string;
  coordinates?: Coordinates;
  role?: string;
  wage?: number;
  isAvailable?: boolean;
  availability?: string[];
};

export type Event = Database["public"]["Tables"]["events"]["Row"] & {
  title?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  coordinates?: Coordinates;
  trucks?: string[];
  assignedStaff?: string[];
  requiredServers?: number;
  status?: string;
};

export type Truck = Database["public"]["Tables"]["trucks"]["Row"] & {
  status?: string;
  driver?: {
    name: string;
  };
  location?: string;
  isAvailable?: boolean;
};

export type Address = Database["public"]["Tables"]["addresses"]["Row"];

export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];

export type TruckAssignment =
  Database["public"]["Tables"]["truck_assignment"]["Row"];

export type TimeOffRequest =
  Database["public"]["Tables"]["time_off_request"]["Row"];

export type Wage = Database["public"]["Tables"]["wage"]["Row"];

// Form data types
export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  address: string;
  role: string;
  email: string;
  phone: string;
  wage: string; // Form data uses string for wage input
  isAvailable: boolean;
  availability: string[];
}

export interface EventFormData {
  name: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  requiredServers: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  trucks: string[];
  isPrepaid: boolean;
}

export interface TruckFormData extends Omit<Truck, "id" | "driver"> {
  driver: string; // Form data uses string for driver input
}

export type TimeOffRequestFormData = Omit<TimeOffRequest, "status">;

// Common types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Navigation types
export interface NavLink {
  name: string;
  href: string;
  icon: ReactNode;
}
