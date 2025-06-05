"use client";

import { useState, useEffect } from "react";
import { findClosestEmployees, EmployeeWithDistance } from "../AlgApi/distance";

interface Employee {
  id: number;
  name: string;
  wage: number;
  address: string;
  role: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  availability: string[];
  coordinates: { latitude: number; longitude: number };
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  trucks: string[];
  assignedStaff: string[];
  requiredServers: number;
  status: string;
  coordinates: { latitude: number; longitude: number };
}

interface AddressFormData {
  streetNumber: string;
  streetName: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

interface AddressValidation {
  streetNumber: boolean;
  streetName: boolean;
  city: boolean;
  province: boolean;
  postalCode: boolean;
  country: boolean;
}

// Add this validation function
function validateAddress(address: string): boolean {
  // Check for required components using more flexible patterns
  const hasStreetNumber = /^\d+/.test(address);
  // Allow street names with ordinals, directions, and spaces
  const hasStreetName = /^\d+\s+[A-Za-z0-9'\-\.\s]+,/.test(address);
  const hasCity = /,\s*Calgary,?/i.test(address);
  const hasProvince = /,\s*Alberta/i.test(address);
  const hasPostalCode = /[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/.test(address);
  const hasCountry = /,\s*Canada$/i.test(address);

  return hasStreetNumber && hasStreetName && hasCity && hasProvince && hasPostalCode && hasCountry;
}

// Add this helper function
function formatAddress(address: string): string {
  // Remove any existing "Calgary, AB" to avoid duplication
  let formattedAddress = address.replace(/,?\s*Calgary,?\s*AB/i, '').trim();
  
  // Add Calgary, AB if not present
  if (!formattedAddress.toLowerCase().includes('calgary')) {
    formattedAddress = `${formattedAddress}, Calgary, Alberta, Canada`;
  }
  
  // Add postal code if it's a numbered street address
  if (/^\d+\s+\d+/.test(formattedAddress)) {
    // Extract the street number and name
    const match = formattedAddress.match(/^(\d+\s+\d+[a-z]?\s+[a-z]+)/i);
    if (match) {
      const streetPart = match[1];
      // Add T2P postal code for downtown addresses
      if (streetPart.toLowerCase().includes('avenue') || 
          streetPart.toLowerCase().includes('street')) {
        formattedAddress = `${streetPart}, Calgary, Alberta T2P, Canada`;
      }
    }
  }
  
  return formattedAddress;
}

export default function DistancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [closestEmployees, setClosestEmployees] = useState<EmployeeWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [invalidAddressType, setInvalidAddressType] = useState<'event' | 'employee' | null>(null);
  const [invalidAddressData, setInvalidAddressData] = useState<{id: string, name: string, address: string} | null>(null);
  const [addressFormData, setAddressFormData] = useState<AddressFormData>({
    streetNumber: '',
    streetName: '',
    city: 'Calgary',
    province: 'Alberta',
    postalCode: '',
    country: 'Canada'
  });
  const [addressValidation, setAddressValidation] = useState<AddressValidation>({
    streetNumber: true,
    streetName: true,
    city: true,
    province: true,
    postalCode: true,
    country: true
  });

  useEffect(() => {
    // Fetch employees and events data
    Promise.all([
      fetch("/employees.json").then(res => res.json()),
      fetch("/events.json").then(res => res.json())
    ])
      .then(([employeesData, eventsData]) => {
        setEmployees(employeesData);
        setEvents(eventsData);
      })
      .catch((err) => setError("Failed to load data"));
  }, []);

  const validateField = (field: keyof AddressFormData, value: string): boolean => {
    switch (field) {
      case 'streetNumber':
        return /^\d+$/.test(value);
      case 'streetName':
        return /^[a-zA-Z0-9\s]+$/.test(value);
      case 'city':
        return value.toLowerCase() === 'calgary';
      case 'province':
        return value.toLowerCase() === 'alberta';
      case 'postalCode':
        return /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(value);
      case 'country':
        return value.toLowerCase() === 'canada';
      default:
        return true;
    }
  };

  const parseAddress = (address: string): AddressFormData => {
    // Split the address into parts
    const parts = address.split(',').map(part => part.trim());
    
    // Parse street address
    const streetParts = parts[0].split(' ');
    let streetNumber = '';
    let streetName = '';
    
    // Find the first number in the address
    const numberMatch = parts[0].match(/^\d+/);
    if (numberMatch) {
      streetNumber = numberMatch[0];
      // Get everything after the number as street name
      streetName = parts[0].substring(numberMatch[0].length).trim();
    } else {
      streetName = parts[0];
    }

    // Find postal code - look for the pattern in the entire address
    const postalCodeMatch = address.match(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : '';

    // Find city, province, and country
    // First, remove the postal code from the address to avoid confusion
    const addressWithoutPostalCode = address.replace(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/, '').trim();
    const partsWithoutPostalCode = addressWithoutPostalCode.split(',').map(part => part.trim());

    // Find city, province, and country from the cleaned parts
    const city = partsWithoutPostalCode.find(p => p.toLowerCase().includes('calgary')) || 'Calgary';
    const province = partsWithoutPostalCode.find(p => p.toLowerCase().includes('alberta')) || 'Alberta';
    const country = partsWithoutPostalCode.find(p => p.toLowerCase().includes('canada')) || 'Canada';

    return {
      streetNumber,
      streetName,
      city,
      province,
      postalCode,
      country
    };
  };

  const handleAddressChange = (field: keyof AddressFormData, value: string) => {
    const newFormData = { ...addressFormData, [field]: value };
    setAddressFormData(newFormData);
    
    // Update validation for the changed field
    const isValid = validateField(field, value);
    setAddressValidation(prev => ({ ...prev, [field]: isValid }));
  };

  const formatAddressFromForm = (formData: AddressFormData): string => {
    // Format the address with proper spacing and commas
    return `${formData.streetNumber} ${formData.streetName}, ${formData.city}, ${formData.province} ${formData.postalCode}, ${formData.country}`;
  };

  const handleAddressSubmit = () => {
    if (!invalidAddressData) return;

    // Validate all fields before submitting
    const newValidation = {
      streetNumber: validateField('streetNumber', addressFormData.streetNumber),
      streetName: validateField('streetName', addressFormData.streetName),
      city: validateField('city', addressFormData.city),
      province: validateField('province', addressFormData.province),
      postalCode: validateField('postalCode', addressFormData.postalCode),
      country: validateField('country', addressFormData.country)
    };
    setAddressValidation(newValidation);

    // Check if any field is invalid
    if (Object.values(newValidation).some(isValid => !isValid)) {
      setError("Please correct the highlighted fields before continuing.");
      return;
    }

    const newAddress = formatAddressFromForm(addressFormData);
    
    if (invalidAddressType === 'event' && selectedEvent) {
      const updatedEvent = { ...selectedEvent, location: newAddress };
      setSelectedEvent(updatedEvent);
      setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    } else if (invalidAddressType === 'employee') {
      const updatedEmployees = employees.map(emp => 
        emp.id === Number(invalidAddressData.id) 
          ? { ...emp, address: newAddress }
          : emp
      );
      setEmployees(updatedEmployees);
    }

    setShowAddressForm(false);
    setInvalidAddressType(null);
    setInvalidAddressData(null);
    handleCalculate();
  };

  const handleCalculate = async () => {
    if (!selectedEvent) {
      setError("Please select an event");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setClosestEmployees([]);

      // Use event coordinates if available, otherwise fallback to address
      const eventCoords = selectedEvent.coordinates;
      const eventLocation = selectedEvent.location;

      // Use the existing findClosestEmployees function with coordinates
      const closest = await findClosestEmployees(
        eventLocation, 
        employees.map(emp => ({
          ...emp,
          coordinates: emp.coordinates
        })),
        eventCoords // Pass coordinates directly
      );
      setClosestEmployees(closest);
    } catch (error) {
      console.error("Error calculating distances:", error);
      setError(error instanceof Error ? error.message : "Failed to calculate distances");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Distance Calculator</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Event</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedEvent?.id || ""}
          onChange={(e) => {
            const event = events.find(ev => ev.id === e.target.value);
            setSelectedEvent(event || null);
          }}
        >
          <option value="">Select an event</option>
          {events.map((event) => {
            const startDate = new Date(event.startTime);
            const formattedDate = startDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            });
            return (
              <option key={event.id} value={event.id}>
                {event.title} - {formattedDate}
              </option>
            );
          })}
        </select>
      </div>

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        onClick={handleCalculate}
        disabled={loading || !selectedEvent}
      >
        {loading ? "Calculating..." : "Calculate Distances"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {showAddressForm && invalidAddressData && (
        <div className="mt-4 p-4 border border-red-500 rounded">
          <h3 className="text-lg font-semibold mb-2">Correct Address for {invalidAddressData.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Number</label>
              <input
                type="text"
                value={addressFormData.streetNumber}
                onChange={(e) => handleAddressChange('streetNumber', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.streetNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!addressValidation.streetNumber && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid street number</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Name</label>
              <input
                type="text"
                value={addressFormData.streetName}
                onChange={(e) => handleAddressChange('streetName', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.streetName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!addressValidation.streetName && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid street name</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={addressFormData.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.city ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!addressValidation.city && (
                <p className="mt-1 text-sm text-red-600">City must be Calgary</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <input
                type="text"
                value={addressFormData.province}
                onChange={(e) => handleAddressChange('province', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.province ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!addressValidation.province && (
                <p className="mt-1 text-sm text-red-600">Province must be Alberta</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                value={addressFormData.postalCode}
                onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.postalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="T2P 1J9"
              />
              {!addressValidation.postalCode && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid postal code (e.g., T2P 1J9)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={addressFormData.country}
                onChange={(e) => handleAddressChange('country', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                  !addressValidation.country ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {!addressValidation.country && (
                <p className="mt-1 text-sm text-red-600">Country must be Canada</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddressForm(false);
                setInvalidAddressType(null);
                setInvalidAddressData(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddressSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save and Continue
            </button>
          </div>
        </div>
      )}

      {closestEmployees.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Closest Employees</h2>
          <div className="grid gap-4">
            {closestEmployees.map((emp) => (
              <div key={emp.employeeId} className="p-4 border rounded">
                <p className="font-medium">{emp.name}</p>
                <p>Distance: {emp.distance.toFixed(2)} km</p>
                <p>Wage: ${emp.wage}/hour</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}