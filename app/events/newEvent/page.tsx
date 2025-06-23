"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { EventFormData, Truck, Employee, TruckAssignment, getTruckTypeColor, getTruckTypeBadge } from "@/app/types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HelpPopup from "@/app/components/HelpPopup";
import ErrorModal from "@/app/components/ErrorModal";
import { eventsApi, truckAssignmentsApi } from "@/lib/supabase/events";
import { employeesApi } from "@/lib/supabase/employees";
import { trucksApi } from "@/lib/supabase/trucks";
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validateEmail, validatePhone, validateRequired, validateNumber, validateDate, validateTimeRange, createValidationRule, getEmptyFieldNames } from "../../lib/formValidation";

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

  // Refs for form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<any>(null);
  const timeRef = useRef<any>(null);
  const endTimeRef = useRef<any>(null);
  const requiredServersRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactPhoneRef = useRef<HTMLInputElement>(null);

  // Add a state to track address validity
  const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
  const [addressValidationMsg, setAddressValidationMsg] = useState<string>("");

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
    setFormData((prev) => ({
      ...prev,
      location: address,
    }));
    setCoordinates(coords);
    setIsAddressValid(!!coords);
    setAddressValidationMsg(coords ? "Address is valid!" : "");
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
        start_time: formData.time,
        end_time: formData.endTime,
        created_at: new Date().toISOString(),
      };
      setTruckAssignments([...truckAssignments, newAssignment]);
     
      setFormData({
        ...formData,
        trucks: [...formData.trucks, truckId],
      });
    }
  };

  const handleTruckSelection = (truckId: string, isSelected: boolean) => {
    if (isSelected) {
      // Add truck to assignments if not already present
      if (!truckAssignments.some((assignment) => assignment.truck_id === truckId)) {
        const newAssignment: TruckAssignment = {
          id: `temp-${Date.now()}`,
          truck_id: truckId,
          driver_id: null, // No driver assigned yet
          event_id: null, // Will be set when event is created
          start_time: formData.time,
          end_time: formData.endTime,
          created_at: new Date().toISOString(),
        };
        setTruckAssignments([...truckAssignments, newAssignment]);
        setFormData({
          ...formData,
          trucks: [...formData.trucks, truckId],
        });
      }
    } else {
      // When truck is deselected, remove assignment
      handleTruckAssignment(truckId, null);
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

  // Handler for Check Address button (to be passed to AddressForm)
  const handleCheckAddress = () => {
    // Only update state if AddressForm validates
    const valid = addressFormRef.current?.validate() ?? false;
    if (valid) {
      setIsAddressValid(true);
      setAddressValidationMsg("Address is valid!");
    } else {
      setIsAddressValid(false);
      setAddressValidationMsg("");
    }
    return valid;
  };

  const validateFormData = (): ValidationError[] => {
    const validationRules: ValidationRule[] = [
      createValidationRule("name", true, undefined, "Event name is required.", nameRef.current),
      createValidationRule("date", true, undefined, "Date is required.", dateRef.current),
      createValidationRule("time", true, undefined, "Start time is required.", timeRef.current),
      createValidationRule("endTime", true, undefined, "End time is required.", endTimeRef.current),
      createValidationRule("location", true, undefined, "Location is required.", null),
      createValidationRule("requiredServers", true, (value: any) => validateNumber(value, 1), "Number of servers is required and must be at least 1.", requiredServersRef.current),
      createValidationRule("contactName", true, undefined, "Contact name is required.", contactNameRef.current),
      createValidationRule("contactEmail", true, validateEmail, "Please enter a valid email address.", contactEmailRef.current),
      createValidationRule("contactPhone", true, validatePhone, "Please enter a valid phone number.", contactPhoneRef.current),
    ];

    const errors = validateForm(formData, validationRules);

    // Additional custom validations
    if (selectedDate && selectedTime && selectedEndTime) {
      if (!validateTimeRange(selectedTime, selectedEndTime)) {
        errors.push({
          field: "timeRange",
          message: "End time must be after start time.",
          element: endTimeRef.current,
        });
      }
    }

    // Check truck assignments
    const trucksWithoutDrivers = truckAssignments.filter(assignment => !assignment.driver_id);
    if (trucksWithoutDrivers.length > 0) {
      errors.push({
        field: "truckAssignments",
        message: "Please assign a driver to all selected trucks.",
        element: null,
      });
    }

    if (truckAssignments.length === 0) {
      errors.push({
        field: "trucks",
        message: "Please select at least one truck and assign a driver to it.",
        element: null,
      });
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const validationErrors = validateFormData();

    // Check for valid coordinates/address
    if (!coordinates || coordinates.latitude === undefined || coordinates.longitude === undefined || isAddressValid === false) {
      validationErrors.push({
        field: "address",
        message: "Please check address.",
        element: null,
      });
    }

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(error => error.message);
      setFormErrors(errorMessages);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
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

  const handleScrollToFirstError = () => {
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      scrollToFirstError(validationErrors);
    }
  };

  return (
    <>
      <div className="create-event-page">
        <h1 className="form-header">Create Event</h1>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              
            />
          </div>

          <div className="input-group">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="location" className="input-label">
                Location <span className="text-red-500">*</span>
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
              onCheckAddress={handleCheckAddress}
            />
          </div>

          <div className="input-group">
            <label htmlFor="date" className="input-label">
              Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              ref={dateRef}
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={new Date()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select date"
            />
          </div>

          <div className="input-group">
            <label htmlFor="time" className="input-label">
              Start Time <span className="text-red-500">*</span>
            </label>
            <DatePicker
              ref={timeRef}
              selected={selectedTime}
              onChange={handleTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select time"
              openToDate={new Date()}
              minTime={new Date(0, 0, 0, 0, 0, 0)}
              maxTime={new Date(0, 0, 0, 23, 59, 59)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="endTime" className="input-label">
              End Time <span className="text-red-500">*</span>
            </label>
            <DatePicker
              ref={endTimeRef}
              selected={selectedEndTime}
              onChange={handleEndTimeChange}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="End Time"
              dateFormat="h:mm aa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select end time"
              openToDate={new Date()}
              minTime={new Date(0, 0, 0, 0, 0, 0)}
              maxTime={new Date(0, 0, 0, 23, 59, 59)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="requiredServers" className="input-label">
              Required Servers <span className="text-red-500">*</span>
            </label>
            <input
              ref={requiredServersRef}
              type="number"
              id="requiredServers"
              name="requiredServers"
              value={formData.requiredServers}
              onChange={handleChange}
              min="0"
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="input-group">
            <label htmlFor="contactName" className="input-label">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={contactNameRef}
              type="text"
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="input-group">
            <label htmlFor="contactEmail" className="input-label">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={contactEmailRef}
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="input-group">
            <label htmlFor="contactPhone" className="input-label">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              ref={contactPhoneRef}
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="input-label">Assign Trucks & Drivers <span className="text-red-500">*</span></label>
            <p className="text-sm text-gray-600 mb-3">
              Check the boxes for trucks you want to include in this event, then
              assign a driver to each selected truck.
            </p>
            <div
              className={`truck-assignment-list space-y-4 ${formErrors.includes("Please select at least one truck and assign a driver to it.") || formErrors.includes("Please assign a driver to all selected trucks.") ? "border-red-500" : ""}`}
            >
              {trucks.map((truck) => {
                const assignedDriver = getAssignedDriverForTruck(truck.id);
                const availableDrivers = getAvailableDrivers();
                const isTruckSelected = truckAssignments.some(
                  (assignment) => assignment.truck_id === truck.id
                );

                return (
                  <div
                    key={truck.id}
                    className={`truck-assignment-item border rounded-lg p-4 ${getTruckTypeColor(truck.type)}`}
                  >
                    {/* Truck Selection Checkbox */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`truck-${truck.id}`}
                          checked={isTruckSelected}
                          onChange={(e) =>
                            handleTruckSelection(truck.id, e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`truck-${truck.id}`}
                          className="font-semibold text-lg cursor-pointer"
                        >
                          {truck.name}
                        </label>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTruckTypeBadge(truck.type)}`}
                        >
                          {truck.type}
                        </span>
                      </div>
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

                    {/* Driver Assignment Section - Only show if truck is selected */}
                    {isTruckSelected && (
                      <div className="space-y-2 mt-4 p-3 bg-white rounded border">
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
                              {driver.first_name} {driver.last_name} (
                              {driver.employee_type})
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
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary of selected trucks */}
            {truckAssignments.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Selected Trucks ({truckAssignments.length}):</h4>
                <ul className="space-y-1">
                  {truckAssignments.map((assignment) => {
                    const truck = trucks.find(t => t.id === assignment.truck_id);
                    const driver = employees.find(e => e.employee_id === assignment.driver_id);
                    
                    return (
                      <li key={assignment.truck_id} className="text-sm text-green-700 flex items-center gap-2">
                        <span>• {truck?.name}</span>
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${getTruckTypeBadge(truck?.type || "")}`}>
                          {truck?.type}
                        </span>
                        <span>- Driver: {driver ? `${driver.first_name} ${driver.last_name}` : 'No driver assigned'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
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
      
      {isAddressValid && addressValidationMsg && (
        <p className="text-green-600">{addressValidationMsg}</p>
      )}
      
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={formErrors.map(msg => ({ field: "form", message: msg }))}
      />
      
      <HelpPopup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
      />
    </>
  );
}
