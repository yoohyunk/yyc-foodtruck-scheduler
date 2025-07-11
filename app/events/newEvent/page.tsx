"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import {
  EventFormData,
  Truck,
  Employee,
  TruckAssignmentCreate,
  getTruckBorderColor,
} from "@/app/types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import HelpPopup from "@/app/components/HelpPopup";
import ErrorModal from "@/app/components/ErrorModal";
import { eventsApi, truckAssignmentsApi } from "@/lib/supabase/events";
import { employeesApi } from "@/lib/supabase/employees";
import { trucksApi } from "@/lib/supabase/trucks";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  validateEmail,
  validatePhone,
  validateNumber,
  validateTimeRange,
  createValidationRule,
  handleAutofill,
} from "../../../lib/formValidation";
import { assignmentsApi } from "@/lib/supabase/assignments";

export default function AddEventPage(): ReactElement {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    date: "",
    endDate: "",
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
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number } | undefined
  >();
  const [trucks, setTrucks] = useState<Truck[]>([]); // State to store truck data
  const [employees, setEmployees] = useState<Employee[]>([]); // State to store employee data
  const [truckAssignments, setTruckAssignments] = useState<
    TruckAssignmentCreate[]
  >([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const addressFormRef = useRef<AddressFormRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isLoadingTrucks, setIsLoadingTrucks] = useState(true);

  // Refs for form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactPhoneRef = useRef<HTMLInputElement>(null);
  const requiredServersRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<DatePicker>(null);
  const endDateRef = useRef<DatePicker>(null);
  const timeRef = useRef<DatePicker>(null);
  const endTimeRef = useRef<DatePicker>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  // Add a state to track address validity
  const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
  const [addressValidationMsg, setAddressValidationMsg] = useState<string>("");

  // State for server warning
  const [serverWarning, setServerWarning] = useState<string>("");

  // Set up autofill detection for all form fields
  useEffect(() => {
    const fields = [
      nameRef,
      contactNameRef,
      contactEmailRef,
      contactPhoneRef,
      requiredServersRef,
    ];

    fields.forEach((fieldRef) => {
      if (fieldRef.current) {
        handleAutofill(fieldRef.current, () => {
          // Update form data when autofill is detected
          const fieldName = fieldRef.current?.name;
          if (fieldName) {
            // Trigger a synthetic change event to update form state
            const event = new Event("change", { bubbles: true });
            fieldRef.current?.dispatchEvent(event);
          }
        });
      }
    });
  }, []);

  // Fetch truck and employee data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingTrucks(true);

        // Fetch truck data
        const trucksData = await trucksApi.getAllTrucks();
        setTrucks(trucksData);

        // Fetch employee data
        const employeesData = await employeesApi.getAllEmployees();
        setEmployees(employeesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingTrucks(false);
      }
    };

    fetchData();

    // Add focus event listener to refresh data when user navigates back
    const handleFocus = () => {
      console.log("New event page: Refreshing data on focus");
      fetchData();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup event listener
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
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
        endDate: date.toISOString().split("T")[0], // Set end date to same as start date
      });
      setSelectedEndDate(date); // Also update the end date picker
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    if (date) {
      setFormData({
        ...formData,
        endDate: date.toISOString().split("T")[0],
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
      const newAssignment: TruckAssignmentCreate = {
        id: `temp-${Date.now()}`,
        truck_id: truckId,
        driver_id: driverId,
        event_id: null, // Will be set when event is created
        start_time: formData.time,
        end_time: formData.endTime,
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
      if (
        !truckAssignments.some((assignment) => assignment.truck_id === truckId)
      ) {
        const newAssignment: TruckAssignmentCreate = {
          id: `temp-${Date.now()}`,
          truck_id: truckId,
          driver_id: null, // No driver assigned yet
          event_id: null, // Will be set when event is created
          start_time: formData.time,
          end_time: formData.endTime,
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

  // Handler for address errors from AddressForm
  const handleAddressError = (errors: ValidationError[]) => {
    setValidationErrors(errors);
    setShowErrorModal(true);
  };

  const validateFormData = (): ValidationError[] => {
    const validationRules: ValidationRule[] = [
      createValidationRule(
        "name",
        true,
        undefined,
        "Event name is required.",
        nameRef.current
      ),
      createValidationRule(
        "date",
        true,
        undefined,
        "Start date is required.",
        dateRef.current?.input
      ),
      createValidationRule(
        "endDate",
        true,
        undefined,
        "End date is required.",
        endDateRef.current?.input
      ),
      createValidationRule(
        "time",
        true,
        undefined,
        "Start time is required.",
        timeRef.current?.input
      ),
      createValidationRule(
        "endTime",
        true,
        undefined,
        "End time is required.",
        endTimeRef.current?.input
      ),
      createValidationRule(
        "location",
        true,
        undefined,
        "Location is required.",
        locationRef.current
      ),
      createValidationRule(
        "requiredServers",
        true,
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 1),
        "Number of servers is required and must be at least 1.",
        requiredServersRef.current
      ),
      createValidationRule(
        "contactName",
        true,
        undefined,
        "Contact name is required.",
        contactNameRef.current
      ),
      createValidationRule(
        "contactEmail",
        true,
        (value: unknown) => typeof value === "string" && validateEmail(value),
        "Please enter a valid email address.",
        contactEmailRef.current
      ),
      createValidationRule(
        "contactPhone",
        true,
        (value: unknown) => typeof value === "string" && validatePhone(value),
        "Please enter a valid phone number.",
        contactPhoneRef.current
      ),
    ];

    const errors = validateForm(
      formData as Record<string, unknown>,
      validationRules
    );

    // Additional custom validations
    if (selectedDate && selectedEndDate) {
      if (selectedEndDate < selectedDate) {
        errors.push({
          field: "endDate",
          message: "End date cannot be before start date.",
          element: endDateRef.current?.input,
        });
      }
    }

    if (selectedDate && selectedTime && selectedEndTime) {
      if (!validateTimeRange(selectedTime, selectedEndTime)) {
        errors.push({
          field: "timeRange",
          message: "End time must be after start time.",
          element: endTimeRef.current?.input,
        });
      }
    }

    // Check truck assignments
    const trucksWithoutDrivers = truckAssignments.filter(
      (assignment) => !assignment.driver_id
    );
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

    // Check for valid coordinates/address
    if (
      !coordinates ||
      coordinates.latitude === undefined ||
      coordinates.longitude === undefined ||
      isAddressValid === false
    ) {
      errors.push({
        field: "address",
        message: "Please check address.",
        element: null,
      });
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const validationErrors = validateFormData();

    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    setServerWarning("");
    try {
      // Get the required number of servers
      const requiredServers = parseInt(formData.requiredServers);

      // Get available servers for auto-assignment
      const availableServers = await assignmentsApi.getAvailableServers(
        formData.date,
        formData.time,
        formData.endTime,
        formData.location
      );

      // Default event status
      let eventStatus = "Scheduled";
      // Only set to Pending if not enough servers
      if (availableServers.length < requiredServers) {
        eventStatus = "Pending";
        setServerWarning(
          `Not enough available servers. Required: ${requiredServers}, Available: ${availableServers.length}. Event will be created and marked as Pending.`
        );
      }

      // Capitalize the event title
      const capitalizeTitle = (title: string) => {
        return title
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      // Create event data with address
      const eventData = {
        title: capitalizeTitle(formData.name),
        start_date: `${formData.date}T${formData.time}`,
        end_date: `${formData.endDate}T${formData.endTime}`,
        description: formData.location,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        created_by: null, // Will be set when user authentication is implemented
        expected_budget: null,
        number_of_driver_needed: truckAssignments.length,
        number_of_servers_needed: requiredServers,
        is_prepaid: formData.isPrepaid,
        status: eventStatus,
        // Address data to be created first
        addressData: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          country: formData.country,
          latitude: coordinates?.latitude?.toString() || "",
          longitude: coordinates?.longitude?.toString() || "",
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
          start_time: `${formData.date}T${assignment.start_time}`,
          end_time: `${formData.endDate}T${assignment.end_time}`,
        });
      }

      // Auto-assign servers (closest ones first) - using availability-checked servers
      const selectedServerIds = availableServers
        .slice(0, requiredServers)
        .map((server) => server.employee_id);

      await assignmentsApi.createServerAssignments(
        newEvent.id,
        selectedServerIds,
        formData.date,
        formData.time,
        formData.endDate,
        formData.endTime
      );

      // Redirect to the specific event page
      window.location.href = `/events/${newEvent.id}`;
    } catch (error) {
      // Only set status to Pending for the not-enough-servers case above
      // For all other errors, just show the error modal
      console.error("Error creating event:", error);
      setValidationErrors([
        {
          field: "submit",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create event. Please try again.",
          element: null,
        },
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
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
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
              onAddressError={handleAddressError}
            />
          </div>

          <div className="input-group">
            <label htmlFor="date" className="input-label">
              Start Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              ref={dateRef}
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={new Date()}
              className="input-field"
              placeholderText="Select start date"
            />
          </div>

          <div className="input-group">
            <label htmlFor="endDate" className="input-label">
              End Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              ref={endDateRef}
              selected={selectedEndDate}
              onChange={handleEndDateChange}
              dateFormat="MMMM d, yyyy"
              minDate={selectedDate || new Date()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholderText="Select end date"
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
              className="input-field"
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
              className="input-field"
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
              className="input-field"
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
              className="input-field"
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
            <label className="input-label">
              Assign Trucks & Drivers <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Check the boxes for trucks you want to include in this event, then
              assign a driver to each selected truck.
            </p>
            <div
              className={`truck-assignment-list space-y-4 ${isLoadingTrucks ? "loading" : ""}`}
            >
              {isLoadingTrucks ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading trucks...</p>
                </div>
              ) : trucks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No trucks available. Please add trucks first.
                  </p>
                </div>
              ) : (
                trucks
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((truck) => {
                    const assignedDriver = getAssignedDriverForTruck(truck.id);
                    const availableDrivers = getAvailableDrivers();
                    const isTruckSelected = truckAssignments.some(
                      (assignment) => assignment.truck_id === truck.id
                    );

                    return (
                      <div
                        key={truck.id}
                        className="truck-assignment-item border rounded-lg p-4"
                        style={{
                          borderLeft: `6px solid ${getTruckBorderColor(truck.type)}`,
                          borderTop: `4px solid ${getTruckBorderColor(truck.type)}`,
                          background: `linear-gradient(135deg, ${getTruckBorderColor(truck.type)}25 0%, var(--white) 100%)`,
                        }}
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
                  })
              )}
            </div>

            {/* Summary of selected trucks */}
            {truckAssignments.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">
                  Selected Trucks ({truckAssignments.length}):
                </h4>
                <ul className="space-y-1">
                  {truckAssignments.map((assignment) => {
                    const truck = trucks.find(
                      (t) => t.id === assignment.truck_id
                    );
                    const driver = employees.find(
                      (e) => e.employee_id === assignment.driver_id
                    );

                    return (
                      <li
                        key={assignment.truck_id}
                        className="text-sm text-green-700 flex items-center gap-2"
                      >
                        <span>• {truck?.name}</span>
                        <span>
                          - Driver:{" "}
                          {driver
                            ? `${driver.first_name} ${driver.last_name}`
                            : "No driver assigned"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          {serverWarning && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
              <strong>Warning:</strong> {serverWarning}
            </div>
          )}

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
                    border: "3px solid var(--success-medium)",
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
        errors={validationErrors}
      />

      <HelpPopup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
      />
    </>
  );
}
