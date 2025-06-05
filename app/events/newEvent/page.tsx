"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { EventFormData, Truck, Coordinates } from "@/app/types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import { findClosestEmployees } from "@/app/AlgApi/distance";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function AddEventPage(): ReactElement {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    time: "",
    location: "",
    requiredServers: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    trucks: [], // Array to store selected trucks
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data
  const [employees, setEmployees] = useState<any[]>([]); // State to store employee data
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const addressFormRef = useRef<AddressFormRef>(null);

  // Fetch truck and employee data
  useEffect(() => {
    // Fetch truck data
    fetch("/trucks.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => setTrucks(data))
      .catch((error) => console.error("Error fetching trucks:", error));

    // Fetch employee data
    fetch("/employees.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => setEmployees(data))
      .catch((error) => console.error("Error fetching employees:", error));
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setFormData({
        ...formData,
        date: date.toISOString().split('T')[0],
      });
    }
  };

  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (time) {
      setFormData({
        ...formData,
        time: time.toTimeString().slice(0, 5),
      });
    }
  };

  const handleLocationChange = (address: string, coords?: Coordinates) => {
    setFormData({
      ...formData,
      location: address,
    });
    setCoordinates(coords);
  };

  const handleTruckSelection = (truckId: string | number): void => {
    const truckIdStr = truckId.toString();
    if (formData.trucks.includes(truckIdStr)) {
      // Remove truck if already selected
      setFormData({
        ...formData,
        trucks: formData.trucks.filter((id) => id !== truckIdStr),
      });
    } else {
      // Add truck if not already selected
      setFormData({
        ...formData,
        trucks: [...formData.trucks, truckIdStr],
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event name is required";
    }

    if (!selectedDate) {
      newErrors.date = "Date is required";
    }

    if (!selectedTime) {
      newErrors.time = "Time is required";
    }

    // Validate address using the ref
    const isAddressValid = addressFormRef.current?.validate() ?? false;
    if (!isAddressValid) {
      newErrors.location = "Please enter a valid address";
    }

    if (!formData.requiredServers) {
      newErrors.requiredServers = "Number of required servers is required";
    } else if (parseInt(formData.requiredServers) <= 0) {
      newErrors.requiredServers = "Number of servers must be greater than 0";
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.contactPhone.replace(/\s/g, ''))) {
      newErrors.contactPhone = "Please enter a valid phone number";
    }

    if (formData.trucks.length === 0) {
      newErrors.trucks = "Please select at least one truck";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Validate required fields
      if (!formData.name || !formData.date || !formData.time || !formData.location || !formData.requiredServers) {
        alert('Please fill in all required fields');
        return;
      }

      // Get the required number of servers
      const requiredServers = parseInt(formData.requiredServers);
      
      // Find the closest available servers
      const closestEmployees = await findClosestEmployees(
        formData.location,
        employees.filter(emp => emp.role === "Server" && emp.isAvailable),
        coordinates as { latitude: number; longitude: number } // Type assertion since we validated coordinates exist
      );

      // Take only the required number of servers
      const assignedStaff = closestEmployees
        .slice(0, requiredServers)
        .map(emp => emp.id.toString());

      // Create event data
      const eventData = {
        title: formData.name,
        startTime: `${formData.date}T${formData.time}`,
        endTime: `${formData.date}T${formData.time}`,
        location: formData.location,
        coordinates: {
          latitude: (coordinates as { latitude: number; longitude: number }).latitude,
          longitude: (coordinates as { latitude: number; longitude: number }).longitude
        },
        trucks: formData.trucks,
        assignedStaff: assignedStaff,
        requiredServers: requiredServers,
        status: "Scheduled",
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone
      };

      // Get existing events
      const response = await fetch('/events.json');
      if (!response.ok) {
        throw new Error('Failed to fetch existing events');
      }
      const events = await response.json();
      
      // Generate new ID (max existing ID + 1)
      const newId = Math.max(...events.map((evt: any) => parseInt(evt.id) || 0)) + 1;
      
      // Create new event with ID
      const newEvent = {
        id: newId.toString(),
        ...eventData
      };

      // Add new event to the list
      const updatedEvents = [...events, newEvent];

      // Save updated list
      const saveResponse = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvents),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save event data');
      }

      // Show success message
      alert('Event created successfully with auto-assigned staff!');
      
      // Redirect to the specific event page
      window.location.href = `/events/${newEvent.id}`;
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="add-event-page">
      <h1 className="form-header">Add New Event</h1>
      <form onSubmit={handleSubmit} className="event-form">
        <div className="input-group">
          <label htmlFor="name" className="input-label">
            Event Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? "border-red-500" : ""}
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="date" className="input-label">
            Date
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MMMM d, yyyy"
            minDate={new Date()}
            className={`w-full px-3 py-2 border ${errors.date ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholderText="Select date"
            required
          />
          {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="time" className="input-label">
            Time
          </label>
          <DatePicker
            selected={selectedTime}
            onChange={handleTimeChange}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            className={`w-full px-3 py-2 border ${errors.time ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholderText="Select time"
            required
            openToDate={new Date()}
            minTime={new Date(0, 0, 0, 0, 0, 0)}
            maxTime={new Date(0, 0, 0, 23, 59, 59)}
          />
          {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="location" className="input-label">
            Location
          </label>
          <AddressForm
            ref={addressFormRef}
            value={formData.location}
            onChange={handleLocationChange}
            placeholder="Enter event location"
            required
            className={errors.location ? "border-red-500" : ""}
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="requiredServers" className="input-label">
            Required Servers
          </label>
          <input
            type="number"
            id="requiredServers"
            name="requiredServers"
            value={formData.requiredServers}
            onChange={handleChange}
            className={errors.requiredServers ? "border-red-500" : ""}
            required
          />
          {errors.requiredServers && <p className="text-red-500 text-sm mt-1">{errors.requiredServers}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="contactName" className="input-label">
            Contact Name
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            className={errors.contactName ? "border-red-500" : ""}
            required
          />
          {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="contactEmail" className="input-label">
            Contact Email
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            className={errors.contactEmail ? "border-red-500" : ""}
            required
          />
          {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="contactPhone" className="input-label">
            Contact Phone
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className={errors.contactPhone ? "border-red-500" : ""}
            required
          />
          {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
        </div>

        {/* Truck Selection Section */}
        <div className="input-group">
          <label className="input-label">Select Trucks</label>
          <div className={`truck-list grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 ${errors.trucks ? "border-red-500" : ""}`}>
            {trucks.map((truck) => {
              const truckIdStr = truck.id.toString();
              return (
                <label
                  key={truckIdStr}
                  className="truck-item flex items-center gap-2 p-2 border rounded-md bg-white shadow-sm"
                  style={{ minWidth: 0 }}
                >
                  <input
                    type="checkbox"
                    checked={formData.trucks.includes(truckIdStr)}
                    onChange={() => handleTruckSelection(truckIdStr)}
                  />
                  <span className="truncate">
                    {truck.name} ({truck.type}) -{' '}
                    <span className={
                      truck.isAvailable
                        ? "status-available text-green-600"
                        : "status-unavailable text-red-500"
                    }>
                      {truck.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.trucks && <p className="text-red-500 text-sm mt-1">{errors.trucks}</p>}
        </div>

        <button type="submit" className="button">
          Create Event
        </button>
      </form>
    </div>
  );
}
