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
import HelpPopup from "@/app/components/HelpPopup";

export default function AddEventPage(): ReactElement {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    time: "",
    endTime: "",
    location: "",
    requiredServers: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    trucks: [], // Array to store selected trucks
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data
  const [employees, setEmployees] = useState<any[]>([]); // State to store employee data
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const addressFormRef = useRef<AddressFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleEndTimeChange = (time: Date | null) => {
    setSelectedEndTime(time);
    if (time) {
      setFormData({
        ...formData,
        endTime: time.toTimeString().slice(0, 5),
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
    const errorList: string[] = [];
    if (!formData.name.trim()) errorList.push('Event name is required.');
    if (!selectedDate) errorList.push('Date is required.');
    if (!selectedTime) errorList.push('Time is required.');
    if (!selectedEndTime) errorList.push('End time is required.');
    const isAddressValid = addressFormRef.current?.validate() ?? false;
    if (!isAddressValid) errorList.push('Please enter a valid address.');
    if (formData.requiredServers === "") errorList.push('Number of servers is required.');
    if (!formData.contactName.trim()) errorList.push('Contact name is required.');
    if (!formData.contactEmail.trim()) errorList.push('Contact email is required.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) errorList.push('Please enter a valid email address.');
    if (!formData.contactPhone.trim()) errorList.push('Contact phone is required.');
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.contactPhone.replace(/\s/g, ''))) errorList.push('Please enter a valid phone number.');
    if (formData.trucks.length === 0) errorList.push('Please select at least one truck.');
    if (selectedDate && selectedTime && selectedEndTime) {
      const start = new Date(selectedDate);
      start.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      const end = new Date(selectedDate);
      end.setHours(selectedEndTime.getHours(), selectedEndTime.getMinutes());
      if (end <= start) errorList.push('End time must be after start time.');
    }
    setFormErrors(errorList);
    setShowErrorModal(errorList.length > 0);
    return errorList.length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate required fields
      if (!formData.name || !formData.date || !formData.time || !formData.location || !formData.requiredServers) {
        setFormErrors(['Please fill in all required fields.']);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Check for valid coordinates before proceeding
      if (!coordinates || coordinates.latitude === undefined || coordinates.longitude === undefined) {
        setFormErrors(['Please check address.']);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Get the required number of servers
      const requiredServers = parseInt(formData.requiredServers);
      
      // Find the closest available servers
      const closestEmployees = await findClosestEmployees(
        formData.location,
        employees.filter(emp => emp.role === "Server" && emp.isAvailable),
        coordinates as { latitude: number; longitude: number }, // Type assertion since we validated coordinates exist
        requiredServers // Pass the required number of servers
      );

      // Take only the required number of servers
      const assignedStaff = closestEmployees
        .slice(0, requiredServers)
        .map(emp => emp.id.toString());

      // Create event data
      const eventData = {
        title: formData.name,
        startTime: `${formData.date}T${formData.time}`,
        endTime: `${formData.date}T${formData.endTime}`,
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

      // Redirect to the specific event page
      window.location.href = `/events/${newEvent.id}`;
    } catch (error) {
      setFormErrors(['Please check address.']);
      setShowErrorModal(true);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-event-page">
        <h1 className="form-header">Create Event</h1>
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
              required
            />
          </div>

          <div className="input-group">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="location" className="input-label">
                Location
              </label>
              <button
                type="button"
                onClick={() => setShowHelpPopup(true)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>
            </div>
            <AddressForm
              ref={addressFormRef}
              value={formData.location}
              onChange={handleLocationChange}
              placeholder="Enter event location"
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select date"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="time" className="input-label">
              Start Time
            </label>
            <DatePicker
              selected={selectedTime}
              onChange={handleTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select time"
              required
              openToDate={new Date()}
              minTime={new Date(0, 0, 0, 0, 0, 0)}
              maxTime={new Date(0, 0, 0, 23, 59, 59)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="endTime" className="input-label">
              End Time
            </label>
            <DatePicker
              selected={selectedEndTime}
              onChange={handleEndTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="End Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select end time"
              required
              openToDate={new Date()}
              minTime={new Date(0, 0, 0, 0, 0, 0)}
              maxTime={new Date(0, 0, 0, 23, 59, 59)}
            />
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
              min="0"
              onWheel={e => (e.target as HTMLInputElement).blur()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Select Trucks</label>
            <div className={`truck-list grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 ${formErrors.includes('Please select at least one truck.') ? "border-red-500" : ""}`}>
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
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span
                  style={{
                    display: 'inline-block',
                    height: '1.5rem',
                    width: '1.5rem',
                    marginRight: '0.5rem',
                    verticalAlign: 'middle',
                    border: '3px solid #22c55e',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    background: 'white',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Creating...
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </span>
            ) : (
              'Create Event'
            )}
          </button>
        </form>
      </div>
      {showErrorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 400,
            border: '4px solid #22c55e',
            fontFamily: 'sans-serif',
          }}>
            <span style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛑</span>
            <p style={{ color: '#15803d', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center', letterSpacing: '0.03em' }}>
              Please fix the following errors:
            </p>
            <ul style={{ textAlign: 'left', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '1rem', listStyle: 'disc inside', width: '100%' }}>
              {formErrors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
            <button
              style={{
                padding: '0.5rem 1.5rem',
                background: '#22c55e',
                color: 'white',
                fontWeight: 700,
                borderRadius: '0.5rem',
                border: 'none',
                boxShadow: '0 2px 8px rgba(34,197,94,0.15)',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'background 0.2s',
              }}
              onClick={() => setShowErrorModal(false)}
              onMouseOver={e => (e.currentTarget.style.background = '#16a34a')}
              onMouseOut={e => (e.currentTarget.style.background = '#22c55e')}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <HelpPopup isOpen={showHelpPopup} onClose={() => setShowHelpPopup(false)} />
    </>
  );
}
