// eployees types

export interface Employee {
  id: number;
  name: string;
  address: string;
  coordinates?: Coordinates;
  role: string;
  email: string;
  phone: string;
  wage: number;
  isAvailable: boolean;
  availability: string[];
}

export interface FormData {
  name: string;
  address: string;
  role: string;
  email: string;
  phone: string;
  wage: string;
  isAvailable: boolean;
  availability: string[];
}

// events types

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
  location: string;
  requiredServers: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  trucks: string[];
}

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

// trucks types

export interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  status: string;
  driver: string;
  location: string;
}

// time off requests types
export interface TimeOffRequest {
  date: string;
  type: string;
  duration: string;
  status: "Approved" | "Pending" | "Rejected";
  reason: string;
}

export interface RequestFormData {
  date: string;
  type: string;
  duration: string;
  reason: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
