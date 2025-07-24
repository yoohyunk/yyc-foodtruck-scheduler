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
  endDate: string;
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
  id: string;
  title: string;
  startTime: string;
  location: string;
  status?: string | null;
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
      return "var(--secondary-dark)";
    case "Beverage Truck":
      return "var(--primary-light)";
    case "Dessert Truck":
      return "var(--secondary-light)";
    case "Holiday Truck":
      return "var(--primary-dark)";
    default:
      return "var(--text-muted)";
  }
};

// Utility function to get truck type CSS class name
export const getTruckTypeClass = (type: string): string => {
  return `type-${(type || "unknown").toLowerCase().replace(/\s+/g, "-")}`;
};

// Employee role color mapping functions
export const getEmployeeRoleColor = (role: string): string => {
  switch (role) {
    case "Driver":
      return "var(--secondary-light)";
    case "Server":
      return "var(--secondary-medium)";
    case "Admin":
      return "var(--primary-light)";
    default:
      return "var(--text-muted)";
  }
};

export const getEmployeeRoleBadge = (role: string): string => {
  switch (role) {
    case "Driver":
      return "var(--secondary-light)";
    case "Server":
      return "var(--secondary-medium)";
    case "Admin":
      return "var(--primary-light)";
    default:
      return "var(--text-muted)";
  }
};

export const getEmployeeRoleBorderColor = (role: string): string => {
  switch (role) {
    case "Driver":
      return "var(--secondary-light)"; // secondary-light
    case "Server":
      return "#var(--secondary-medium)"; // secondary-medium
    case "Admin":
      return "#var(--primary-light)"; // primary-light
    default:
      return "#718096"; // text-muted
  }
};

export const getEmployeeRoleFilterColor = (
  role: string,
  isActive: boolean
): string => {
  if (!isActive) return "bg-gray-200 text-primary-dark";

  switch (role) {
    case "Driver":
      return "bg-secondary-light text-white";
    case "Server":
      return "bg-secondary-medium text-white";
    case "Admin":
      return "bg-primary-light text-white";
    default:
      return "bg-primary-dark text-white";
  }
};

// Event status color mapping functions
export const getEventStatusColor = (status: string): string => {
  switch (status) {
    case "Pending":
      return "var(--secondary-light)"; // secondary-light
    case "Scheduled":
      return "var(--secondary-medium)"; // secondary-medium
    default:
      return "var(--text-muted)"; // text-muted
  }
};

export const getEventStatusBorderColor = (status: string): string => {
  switch (status) {
    case "Pending":
      return "var(--secondary-light)"; // secondary-light
    case "Scheduled":
      return "var(--secondary-medium)"; // secondary-medium
    default:
      return "var(--text-muted)"; // text-muted
  }
};

export const getEventStatusFilterColor = (
  status: string,
  isActive: boolean
): string => {
  if (!isActive) return "bg-gray-200 text-primary-dark";

  switch (status) {
    case "Pending":
      return "bg-secondary-light text-white";
    case "Scheduled":
      return "bg-secondary-medium text-white";
    default:
      return "bg-primary-dark text-white";
  }
};

// Time-off request status color mapping functions
export const getTimeOffStatusBorderColor = (status: string): string => {
  switch (status) {
    case "Approved":
      return "var(--success-medium)";
    case "Rejected":
      return "var(--error-medium)";
    case "Pending":
      return "var(--warning-medium)";
    default:
      return "var(--text-muted)";
  }
};

export type CheckinData = {
  clock_in_at?: string | null;
  clock_out_at?: string | null;
  // Add other fields as needed
};
export type Assignment = {
  id: string;
  type: "server" | "truck";
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  events?: {
    title?: string;
    address?: {
      street?: string;
      city?: string;
      province?: string;
      postal_code?: string;
      country?: string;
    };
  };
  trucks?: { name?: string };
  clock_in_at?: string | null;
  clock_out_at?: string | null;
};

export interface CheckinEmployee {
  employee_id: string;
  first_name?: string;
  last_name?: string;
  employee_type?: string;
}

interface AssignmentInfo {
  id: string;
  type: "server" | "truck";
  event_title?: string;
  truck_name?: string;
  start_time: string;
  end_time: string;
  event_id?: string;
}
export interface CheckinLog {
  id: string;
  employee: CheckinEmployee;
  assignment: AssignmentInfo;
  clock_in_at: string | null;
  clock_out_at: string | null;
}

// Type for basic event info from limited view
export type EventBasicInfo = Tables<"event_basic_info_view"> & {
  status?: string | null;
};
