// Employee types
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  address: string;
  coordinates?: Coordinates;
  role: string;
  email: string;
  phone: string;
  wage: number;
  isAvailable: boolean;
  availability: string[];
}

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

// Event types
export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  coordinates?: Coordinates;
  trucks: string[];
  assignedStaff: string[];
  requiredServers: number;
  status: string;
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
}

// Truck types
export interface Truck {
  id: string;
  name: string;
  type: string;
  capacity: string;
  status: string;
  driver?: {
    name: string;
  };
  location: string;
  isAvailable: boolean;
}

export interface TruckFormData extends Omit<Truck, "id" | "driver"> {
  driver: string; // Form data uses string for driver input
}

// Time off request types
export interface TimeOffRequest {
  date: string;
  type: string;
  duration: string;
  status: "Approved" | "Pending" | "Rejected";
  reason: string;
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
  icon: string;
}
