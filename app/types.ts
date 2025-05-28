// eployees types

export interface Employee {
  id: number;
  name: string;
  address: string;
  role: string;
  email: string;
  phone: string;
  wage: string;
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
  time: string;
  location: string;
  distance: number;
  requiredServers: number;
  trucks?: string[];
  assignedStaff?: string[];
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
