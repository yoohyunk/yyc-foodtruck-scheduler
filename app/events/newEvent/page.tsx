"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { EventFormData, Truck, Employee, TruckAssignment } from "@/app/types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HelpPopup from "@/app/components/HelpPopup";
import { eventsApi, truckAssignmentsApi } from "@/lib/supabase/events";
import { employeesApi } from "@/lib/supabase/employees";
import { trucksApi } from "@/lib/supabase/trucks";

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
    isPrepaid: false, // Add isPrepaid field
    // Address fields
    street: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number } | undefined
  >();
  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data
  const [employees, setEmployees] = useState<Employee[]>([]); // State to store employee data
  const [truckAssignments, setTruckAssignments] = useState<TruckAssignment[]>(
    []
  );
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const addressFormRef = useRef<AddressFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch truck and employee data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch truck data
        const trucksData = await trucksApi.getAllTrucks();
        setTrucks(trucksData);

        // Fetch employee data
        const employeesData = await employeesApi.getAllEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
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
        date: date.toISOString().split("T")[0],
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

  const handleLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setFormData({
      ...formData,
      location: address,
    });
    setCoordinates(coords);

    // Parse address string to extract components
    if (address) {
      const addressData = parseAddressString(address);
      setFormData((prev) => ({
        ...prev,
        location: address,
        ...addressData,
      }));
    }
  };

  // Parse address string to extract street, city, province, postal code
  const parseAddressString = (address: string) => {
    try {
      // Expected format: "123 Street Name NW, Calgary, T2N 1N4"
      const parts = address.split(", ");
      if (parts.length >= 2) {
        const streetPart = parts[0];
        const cityPart = parts[1];
        const postalCodePart = parts[2] || "";

        return {
          street: streetPart,
          city: cityPart,
          province: "Alberta", // Default for Alberta
          postalCode: postalCodePart,
          country: "Canada", // Default for Canada
        };
      }
    } catch (error) {
      console.error("Error parsing address:", error);
    }

    return {
      street: address,
      city: "Calgary",
      province: "Alberta",
      postalCode: "",
      country: "Canada",
    };
  };

  const handleTruckAssignment = (truckId: string, driverId: string | null) => {
    const existingAssignment = truckAssignments.find(
      (assignment) => assignment.truck_id === truckId
    );

    if (existingAssignment) {
      if (driverId === null) {
        // Remove assignment if no driver selected
        setTruckAssignments(
          truckAssignments.filter(
            (assignment) => assignment.truck_id !== truckId
          )
        );
        // Also remove from formData.trucks
        setFormData({
          ...formData,
          trucks: formData.trucks.filter((id) => id !== truckId),
        });
      } else {
        // Update existing assignment
        setTruckAssignments(
          truckAssignments.map((assignment) =>
            assignment.truck_id === truckId
              ? { ...assignment, driver_id: driverId }
              : assignment
          )
        );
      }
    } else if (driverId !== null) {
      // Create new assignment
      const newAssignment: TruckAssignment = {
        id: `temp-${Date.now()}`,
        truck_id: truckId,
        driver_id: driverId,
        event_id: null, // Will be set when event is created
        start_time: `${formData.date}T${formData.time}`,
        end_time: `${formData.date}T${formData.endTime}`,
        created_at: new Date().toISOString(),
      };
      setTruckAssignments([...truckAssignments, newAssignment]);
      // Also add to formData.trucks
      setFormData({
        ...formData,
        trucks: [...formData.trucks, truckId],
      });
    }
  };

  const getAssignedDriverForTruck = (truckId: string): Employee | null => {
    const assignment = truckAssignments.find((a) => a.truck_id === truckId);
    if (assignment?.driver_id) {
      return (
        employees.find((emp) => emp.employee_id === assignment.driver_id) ||
        null
      );
    }
    return null;
  };

  const getAvailableDrivers = (): Employee[] => {
    return employees.filter(
      (emp) => emp.employee_type === "Driver" && emp.is_available
    );
  };

  const validateForm = (): boolean => {
    const errorList: string[] = [];
    if (!formData.name.trim()) errorList.push("Event name is required.");
    if (!selectedDate) errorList.push("Date is required.");
    if (!selectedTime) errorList.push("Time is required.");
    if (!selectedEndTime) errorList.push("End time is required.");
    const isAddressValid = addressFormRef.current?.validate() ?? false;
    if (!isAddressValid) errorList.push("Please enter a valid address.");
    if (formData.requiredServers === "")
      errorList.push("Number of servers is required.");
    if (!formData.contactName.trim())
      errorList.push("Contact name is required.");
    if (!formData.contactEmail.trim())
      errorList.push("Contact email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail))
      errorList.push("Please enter a valid email address.");
    if (!formData.contactPhone.trim())
      errorList.push("Contact phone is required.");
    else if (
      !/^\+?[\d\s-]{10,}$/.test(formData.contactPhone.replace(/\s/g, ""))
    )
      errorList.push("Please enter a valid phone number.");
    if (truckAssignments.length === 0)
      errorList.push("Please assign at least one truck with a driver.");
    if (selectedDate && selectedTime && selectedEndTime) {
      const start = new Date(selectedDate);
      start.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      const end = new Date(selectedDate);
      end.setHours(selectedEndTime.getHours(), selectedEndTime.getMinutes());
      if (end <= start) errorList.push("End time must be after start time.");
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
      if (
        !formData.name ||
        !formData.date ||
        !formData.time ||
        !formData.location ||
        !formData.requiredServers
      ) {
        setFormErrors(["Please fill in all required fields."]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Check for valid coordinates before proceeding
      if (
        !coordinates ||
        coordinates.latitude === undefined ||
        coordinates.longitude === undefined
      ) {
        setFormErrors(["Please check address."]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Get the required number of servers
      const requiredServers = parseInt(formData.requiredServers);

      // Create event data with address
      const eventData = {
        title: formData.name,
        start_date: `${formData.date}T${formData.time}`,
        end_date: `${formData.date}T${formData.endTime}`,
        description: formData.location,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        created_by: null, // Will be set when user authentication is implemented
        expected_budget: null,
        number_of_driver_needed: truckAssignments.length,
        number_of_servers_needed: requiredServers,
        is_prepaid: formData.isPrepaid,
        // Address data to be created first
        addressData: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          country: formData.country,
          latitude: coordinates.latitude.toString(),
          longitude: coordinates.longitude.toString(),
        },
      };

      // Create event in Supabase (this will create address first)
      const newEvent = await eventsApi.createEvent(eventData);

      // Create truck assignments in Supabase
      for (const assignment of truckAssignments) {
        await truckAssignmentsApi.createTruckAssignment({
          truck_id: assignment.truck_id,
          driver_id: assignment.driver_id,
          event_id: newEvent.id,
          start_time: assignment.start_time,
          end_time: assignment.end_time,
        });
      }

      // Redirect to the specific event page
      window.location.href = `/events/${newEvent.id}`;
    } catch (error) {
      console.error("Error creating event:", error);
      setFormErrors([
        error instanceof Error
          ? error.message
          : "Failed to create event. Please try again.",
      ]);
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
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
            <label className="input-label">Payment Status</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrepaid"
                  name="isPrepaid"
                  checked={formData.isPrepaid}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isPrepaid: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Prepaid Event
                </span>
              </label>
              <span className="text-xs text-gray-500">
                Check if payment has been received in advance
              </span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Assign Trucks & Drivers</label>
            <div
              className={`truck-assignment-list space-y-4 ${formErrors.includes("Please assign at least one truck with a driver.") ? "border-red-500" : ""}`}
            >
              {trucks.map((truck) => {
                const assignedDriver = getAssignedDriverForTruck(truck.id);
                const availableDrivers = getAvailableDrivers();

                return (
                  <div
                    key={truck.id}
                    className="truck-assignment-item border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">
                        {truck.name} ({truck.type})
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          truck.is_available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {truck.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Assign Driver:
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={assignedDriver?.employee_id || ""}
                        onChange={(e) =>
                          handleTruckAssignment(
                            truck.id,
                            e.target.value || null
                          )
                        }
                      >
                        <option value="">No driver assigned</option>
                        {availableDrivers.map((driver) => (
                          <option
                            key={driver.employee_id}
                            value={driver.employee_id}
                          >
                            {driver.first_name} {driver.last_name}
                          </option>
                        ))}
                      </select>

                      {assignedDriver && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Assigned Driver:</strong>{" "}
                            {assignedDriver.first_name}{" "}
                            {assignedDriver.last_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span
                  style={{
                    display: "inline-block",
                    height: "1.5rem",
                    width: "1.5rem",
                    marginRight: "0.5rem",
                    verticalAlign: "middle",
                    border: "3px solid #22c55e",
                    borderTop: "3px solid transparent",
                    borderRadius: "50%",
                    background: "white",
                    animation: "spin 1s linear infinite",
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
              "Create Event"
            )}
          </button>
        </form>
      </div>
      {showErrorModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "1.5rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              padding: "2.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              maxWidth: 400,
              border: "4px solid #22c55e",
              fontFamily: "sans-serif",
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              🛑
            </span>
            <p
              style={{
                color: "#15803d",
                fontWeight: 800,
                fontSize: "1.25rem",
                marginBottom: "1rem",
                textAlign: "center",
                letterSpacing: "0.03em",
              }}
            >
              Please fix the following errors:
            </p>
            <ul
              style={{
                textAlign: "left",
                marginBottom: "1.5rem",
                color: "#b91c1c",
                fontSize: "1rem",
                listStyle: "disc inside",
                width: "100%",
              }}
            >
              {formErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
            <button
              style={{
                padding: "0.5rem 1.5rem",
                background: "#22c55e",
                color: "white",
                fontWeight: 700,
                borderRadius: "0.5rem",
                border: "none",
                boxShadow: "0 2px 8px rgba(34,197,94,0.15)",
                cursor: "pointer",
                fontSize: "1rem",
                transition: "background 0.2s",
              }}
              onClick={() => setShowErrorModal(false)}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#16a34a")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#22c55e")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <HelpPopup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
      />
    </>
  );
}
