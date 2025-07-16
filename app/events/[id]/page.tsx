"use client";
import "../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ReactElement, useCallback } from "react";
import { extractDate, extractTime } from "../utils";
import {
  Event,
  Employee,
  Truck,
  TruckAssignment,
  EventFormData,
} from "@/app/types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import { eventsApi, truckAssignmentsApi } from "@/lib/supabase/events";
import { employeesApi } from "@/lib/supabase/employees";
import { trucksApi } from "@/lib/supabase/trucks";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { createLocalDateTime } from "@/lib/utils";
import {
  validateForm,
  ValidationRule,
  validateNumber,
  createValidationRule,
  sanitizeFormData,
  ValidationError,
} from "@/lib/formValidation";
import ErrorModal from "../../components/ErrorModal";

// Import components
import EmployeeSelectionModal from "./components/EmployeeSelectionModal";
import TruckAssignmentModal from "./components/TruckAssignmentModal";
import EditEventModal from "./components/EditEventModal";
import DeleteEventModal from "./components/DeleteEventModal";
import TruckAssignmentsSection from "./components/TruckAssignmentsSection";
import ServerAssignmentsSection from "./components/ServerAssignmentsSection";

export default function EventDetailsPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [truckAssignments, setTruckAssignments] = useState<TruckAssignment[]>(
    []
  );
  const [serverAssignments, setServerAssignments] = useState<
    Array<{
      id: string;
      employee_id: string;
      event_id: string;
      start_date: string;
      end_date: string;
      is_completed: boolean;
      status: string;
      employees: Employee;
    }>
  >([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [isLoadingTrucks, setIsLoadingTrucks] = useState<boolean>(true);
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { shouldHighlight } = useTutorial();

  // Edit form state
  const [editFormData, setEditFormData] = useState<EventFormData>({
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
    trucks: [],
    isPrepaid: false,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee filter state - default to Server for server assignments
  const [employeeFilter, setEmployeeFilter] = useState<string>("Server");

  // Modal state management - use useCallback to prevent unnecessary re-renders
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isTruckAssignmentModalOpen, setTruckAssignmentModalOpen] =
    useState<boolean>(false);
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Error modal state
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [errorModalErrors, setErrorModalErrors] = useState<ValidationError[]>(
    []
  );
  const [errorModalTitle, setErrorModalTitle] = useState<string>("");
  const [errorModalType, setErrorModalType] = useState<"error" | "success">(
    "error"
  );

  // Server warning state
  const [showServerWarning, setShowServerWarning] = useState<boolean>(false);

  // Memoize modal open/close handlers to prevent re-renders
  const openEmployeeModal = useCallback(() => setEmployeeModalOpen(true), []);
  const closeEmployeeModal = useCallback(() => setEmployeeModalOpen(false), []);
  const openTruckModal = useCallback(
    () => setTruckAssignmentModalOpen(true),
    []
  );
  const closeTruckModal = useCallback(
    () => setTruckAssignmentModalOpen(false),
    []
  );
  const openEditModal = useCallback(() => setEditModalOpen(true), []);
  const closeEditModal = useCallback(() => setEditModalOpen(false), []);
  const openDeleteModal = useCallback(() => setDeleteModalOpen(true), []);
  const closeDeleteModal = useCallback(() => setDeleteModalOpen(false), []);

  // Fetch event details from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setIsLoadingEvent(true);
        setError(null);
        const eventData = await eventsApi.getEventById(id as string);
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to load event details.");
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Fetch employees and trucks from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const employeesData = await employeesApi.getAllEmployees();
        setEmployees(employeesData);
        setIsLoadingEmployees(false);

        // Fetch trucks
        const trucksData = await trucksApi.getAllTrucks();
        setTrucks(trucksData);
        setIsLoadingTrucks(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoadingEmployees(false);
        setIsLoadingTrucks(false);
      }
    };

    fetchData();

    // Add focus event listener to refresh data when user navigates back
    const handleFocus = () => {
      console.log("Event details page: Refreshing data on focus");
      fetchData();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup event listener
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fetch truck assignments when event is loaded
  useEffect(() => {
    const fetchTruckAssignments = async () => {
      if (!event?.id) return;

      try {
        const assignments =
          await truckAssignmentsApi.getTruckAssignmentsByEventId(event.id);
        setTruckAssignments(assignments);
      } catch (error) {
        console.error("Error fetching truck assignments:", error);
      }
    };

    fetchTruckAssignments();
  }, [event?.id]);

  // Fetch server assignments when event is loaded
  useEffect(() => {
    const fetchServerAssignments = async () => {
      if (!event?.id) return;

      try {
        const assignments = await assignmentsApi.getServerAssignmentsByEventId(
          event.id
        );
        setServerAssignments(assignments);

        // Check if we need to show server warning
        const requiredServers = event.number_of_servers_needed || 0;
        const assignedServers = assignments.length;

        if (assignedServers < requiredServers) {
          setShowServerWarning(true);
        } else {
          setShowServerWarning(false);
        }
      } catch (error) {
        console.error("Error fetching server assignments:", error);
      }
    };

    fetchServerAssignments();
  }, [event?.id, event?.number_of_servers_needed]);

  // Update assigned employees when server assignments change
  useEffect(() => {
    if (serverAssignments.length > 0 && employees.length > 0) {
      // Map server assignments to employee objects
      const assignedEmployeeIds = serverAssignments.map(
        (assignment) => assignment.employee_id
      );
      const assignedEmployeeObjects = employees.filter((emp) =>
        assignedEmployeeIds.includes(emp.employee_id)
      );

      // Only update if the assigned employees have actually changed
      const currentIds = new Set(
        assignedEmployees.map((emp) => emp.employee_id)
      );
      const newIds = new Set(
        assignedEmployeeObjects.map((emp) => emp.employee_id)
      );

      if (
        currentIds.size !== newIds.size ||
        !assignedEmployeeObjects.every((emp) => currentIds.has(emp.employee_id))
      ) {
        setAssignedEmployees(assignedEmployeeObjects);
      }
    } else if (assignedEmployees.length > 0) {
      setAssignedEmployees([]);
    }
  }, [serverAssignments, employees, assignedEmployees]);

  // New handler for saving employee assignments from modal
  const handleSaveEmployeeAssignments = async (
    selectedEmployeeIds: string[]
  ) => {
    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      return;
    }

    try {
      // Get current assignments
      const currentAssignmentIds = new Set(
        serverAssignments.map((assignment) => assignment.employee_id)
      );
      const newAssignmentIds = new Set(selectedEmployeeIds);

      // Find employees to remove (in current but not in new)
      const employeesToRemove = Array.from(currentAssignmentIds).filter(
        (id) => !newAssignmentIds.has(id)
      );

      // Find employees to add (in new but not in current)
      const employeesToAdd = Array.from(newAssignmentIds).filter(
        (id) => !currentAssignmentIds.has(id)
      );

      // Remove assignments
      for (const employeeId of employeesToRemove) {
        const assignmentToRemove = serverAssignments.find(
          (assignment) => assignment.employee_id === employeeId
        );
        if (assignmentToRemove) {
          await assignmentsApi.removeServerAssignment(
            assignmentToRemove.id,
            event.id
          );
        }
      }

      // Add assignments
      for (const employeeId of employeesToAdd) {
        await assignmentsApi.addServerAssignment(
          event.id,
          employeeId,
          event.start_date || new Date().toISOString(),
          event.end_date || new Date().toISOString()
        );
      }

      // Refresh server assignments
      const updatedAssignments =
        await assignmentsApi.getServerAssignmentsByEventId(event.id);
      setServerAssignments(updatedAssignments);

      // Refresh event data to get updated required servers count
      const updatedEvent = await eventsApi.getEventById(event.id);
      if (updatedEvent) {
        setEvent(updatedEvent);
      }

      // Update server warning
      const requiredServers = updatedEvent?.number_of_servers_needed || 0;
      const assignedServers = updatedAssignments.length;

      if (assignedServers < requiredServers) {
        setShowServerWarning(true);
      } else {
        setShowServerWarning(false);
      }

      showSuccess("Success", "Employee assignments updated successfully.");
    } catch (error) {
      console.error("Error saving employee assignments:", error);
      showError(
        "Assignment Error",
        "Failed to save employee assignments. Please try again."
      );
    }
  };

  // Error handling helper
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("error");
    setIsErrorModalOpen(true);
  };

  const showSuccess = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("success");
    setIsErrorModalOpen(true);
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  // Function to refresh server assignments
  const refreshServerAssignments = async () => {
    if (!event?.id) return;

    try {
      const assignments = await assignmentsApi.getServerAssignmentsByEventId(
        event.id
      );
      setServerAssignments(assignments);

      // Update server warning
      const requiredServers = event.number_of_servers_needed || 0;
      const assignedServers = assignments.length;

      if (assignedServers < requiredServers) {
        setShowServerWarning(true);
      } else {
        setShowServerWarning(false);
      }
    } catch (error) {
      console.error("Error refreshing server assignments:", error);
    }
  };

  // Function to refresh truck assignments
  const refreshTruckAssignments = async () => {
    if (!event?.id) return;

    try {
      const assignments =
        await truckAssignmentsApi.getTruckAssignmentsByEventId(event.id);
      setTruckAssignments(assignments);
    } catch (error) {
      console.error("Error refreshing truck assignments:", error);
    }
  };

  const handleTruckAssignment = async (
    truckId: string,
    driverId: string | null
  ) => {
    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      return;
    }

    // Check if driver is already assigned to another truck for this event
    if (driverId !== null) {
      const driverAlreadyAssigned = truckAssignments.find(
        (assignment) =>
          assignment.driver_id === driverId && assignment.truck_id !== truckId
      );

      if (driverAlreadyAssigned) {
        const driver = employees.find((emp) => emp.employee_id === driverId);
        const driverName = driver
          ? `${driver.first_name} ${driver.last_name}`
          : "Driver";
        const otherTruck = trucks.find(
          (truck) => truck.id === driverAlreadyAssigned.truck_id
        );
        const truckName = otherTruck?.name || "another truck";

        showError(
          "Driver Conflict",
          `${driverName} is already assigned to ${truckName} for this event. A driver cannot be assigned to multiple trucks.`
        );
        return;
      }
    }

    try {
      const existingAssignment = truckAssignments.find(
        (assignment) => assignment.truck_id === truckId
      );

      if (existingAssignment) {
        if (driverId === null) {
          // Remove assignment if no driver is assigned
          await truckAssignmentsApi.deleteTruckAssignment(
            existingAssignment.id
          );
          await refreshTruckAssignments();
          showSuccess("Success", "Truck assignment removed successfully.");
        } else {
          // Update existing assignment with new driver
          await truckAssignmentsApi.updateTruckAssignment(
            existingAssignment.id,
            { driver_id: driverId }
          );
          await refreshTruckAssignments();
          showSuccess("Success", "Truck assignment updated successfully.");
        }
      } else {
        // Create new assignment for the truck (with or without driver)
        // Only create if driverId is not null (truck is selected)
        if (driverId !== null) {
          await truckAssignmentsApi.createTruckAssignment({
            truck_id: truckId,
            driver_id: driverId,
            event_id: event.id,
            start_time: event.start_date || new Date().toISOString(),
            end_time: event.end_date || new Date().toISOString(),
          });
          await refreshTruckAssignments();
          showSuccess("Success", "Truck assigned successfully.");
        }
        // If driverId is null and no existing assignment, do nothing (truck is not selected)
      }
    } catch (error) {
      console.error("Error handling truck assignment:", error);
      showError(
        "Assignment Error",
        "Failed to update truck assignment. Please try again."
      );
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
    // Return all drivers and managers (not just available ones) for the dropdown
    return employees.filter(
      (emp) => emp.employee_type === "Driver" || emp.employee_type === "Manager"
    );
  };

  const handleDeleteEvent = async () => {
    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      return;
    }

    try {
      // Delete truck assignments first
      await truckAssignmentsApi.deleteTruckAssignmentsByEventId(event.id);

      // Delete the event
      await eventsApi.deleteEvent(event.id);

      showSuccess("Success", "Event deleted successfully.");

      // Navigate back to events page
      router.push("/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      showError("Delete Error", "Failed to delete event. Please try again.");
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      return;
    }

    try {
      const updatedEvent = await eventsApi.updateEvent(event.id, {
        is_prepaid: !event.is_prepaid,
      });
      setEvent(updatedEvent);
      showSuccess(
        "Success",
        `Payment status updated to ${updatedEvent.is_prepaid ? "Prepaid" : "Pending"}.`
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      showError(
        "Update Error",
        "Failed to update payment status. Please try again."
      );
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      return;
    }

    try {
      const updatedEvent = await eventsApi.updateEvent(event.id, {
        status: newStatus,
      });
      setEvent(updatedEvent);
      showSuccess("Success", `Event status updated to ${newStatus}.`);
    } catch (error) {
      console.error("Error updating event status:", error);
      showError(
        "Update Error",
        "Failed to update event status. Please try again."
      );
    }
  };

  const handleEditEvent = () => {
    if (!event) return;

    // Populate edit form with current event data
    const startDate = event.start_date ? new Date(event.start_date) : null;
    const endDate = event.end_date ? new Date(event.end_date) : null;

    setEditFormData({
      name: event.title || "",
      date: startDate ? startDate.toISOString().split("T")[0] : "",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      time: startDate ? startDate.toTimeString().slice(0, 5) : "",
      endTime: endDate ? endDate.toTimeString().slice(0, 5) : "",
      location: event.description || "",
      requiredServers: event.number_of_servers_needed?.toString() || "",
      contactName: event.contact_name || "",
      contactEmail: event.contact_email || "",
      contactPhone: event.contact_phone || "",
      trucks: [],
      isPrepaid: event.is_prepaid || false,
      // Address fields
      street: "",
      city: "",
      province: "",
      postalCode: "",
      country: "",
      latitude: "",
      longitude: "",
    });

    setSelectedDate(startDate);
    setSelectedEndDate(endDate);
    setSelectedTime(startDate);
    setSelectedEndTime(endDate);
    openEditModal();
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleEditDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setEditFormData({
        ...editFormData,
        date: date.toISOString().split("T")[0],
      });
    }
  };

  const handleEditTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (time) {
      setEditFormData({
        ...editFormData,
        time: time.toTimeString().slice(0, 5),
      });
    }
  };

  const handleEditEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    if (date) {
      setEditFormData({
        ...editFormData,
        endDate: date.toISOString().split("T")[0],
      });
    }
  };

  const handleEditEndTimeChange = (time: Date | null) => {
    setSelectedEndTime(time);
    if (time) {
      setEditFormData({
        ...editFormData,
        endTime: time.toTimeString().slice(0, 5),
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    setError(null);

    if (!event?.id) {
      showError("Error", "Event not found. Please refresh the page.");
      setIsSubmitting(false);
      return;
    }

    // Sanitize form data
    const sanitizedData = sanitizeFormData(editFormData);

    // Validate form data
    const validationRules: ValidationRule[] = [
      createValidationRule("name", true, undefined, "Event name is required."),
      createValidationRule(
        "date",
        true,
        (value: unknown) => typeof value === "string" && value.trim() !== "",
        "Please select a valid date."
      ),
      createValidationRule(
        "time",
        true,
        (value: unknown) => typeof value === "string" && value.trim() !== "",
        "Please select a valid start time."
      ),
      createValidationRule(
        "endTime",
        true,
        (value: unknown) => typeof value === "string" && value.trim() !== "",
        "Please select a valid end time."
      ),
      createValidationRule(
        "location",
        true,
        undefined,
        "Location is required."
      ),
      createValidationRule(
        "requiredServers",
        true,
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 0),
        "Required servers must be a positive number."
      ),
    ];

    const validationErrors = validateForm(
      sanitizedData as Record<string, unknown>,
      validationRules
    );

    // Validate time range
    if (selectedTime && selectedEndTime && selectedTime >= selectedEndTime) {
      validationErrors.push({
        field: "endTime",
        message: "End time must be after start time.",
        element: null,
      });
    }

    if (validationErrors.length > 0) {
      setErrorModalErrors(validationErrors);
      setErrorModalTitle("Validation Errors");
      setErrorModalType("error");
      setIsErrorModalOpen(true);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time to create proper datetime strings with timezone
      const startDateTime =
        selectedDate && selectedTime
          ? createLocalDateTime(
              selectedDate.toISOString().split('T')[0],
              selectedTime.toTimeString().slice(0, 5)
            )
          : null;

      const endDateTime =
        selectedDate && selectedEndTime
          ? createLocalDateTime(
              selectedDate.toISOString().split('T')[0],
              selectedEndTime.toTimeString().slice(0, 5)
            )
          : null;

      console.log('Updating event with times:', {
        original: { 
          selectedDate: selectedDate?.toISOString().split('T')[0], 
          selectedTime: selectedTime?.toTimeString().slice(0, 5),
          selectedEndDate: selectedEndDate?.toISOString().split('T')[0],
          selectedEndTime: selectedEndTime?.toTimeString().slice(0, 5)
        },
        stored: { start_date: startDateTime, end_date: endDateTime }
      });

      // Capitalize the event title
      const capitalizeTitle = (title: string) => {
        return title
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      // Update the event
      const updatedEvent = await eventsApi.updateEvent(event.id, {
        title: capitalizeTitle(sanitizedData.name),
        description: sanitizedData.location,
        start_date: startDateTime || undefined,
        end_date: endDateTime || undefined,
        number_of_servers_needed: parseInt(
          sanitizedData.requiredServers as string
        ),
        contact_name: sanitizedData.contactName,
        contact_email: sanitizedData.contactEmail,
        contact_phone: sanitizedData.contactPhone,
        is_prepaid: sanitizedData.isPrepaid,
      });

      // Update local state
      setEvent(updatedEvent);
      closeEditModal();
      showSuccess("Success", "Event updated successfully.");
    } catch (error) {
      console.error("Error updating event:", error);
      showError("Update Error", "Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-500">Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 text-lg">{error}</p>
        <button onClick={() => router.push("/events")} className="button mt-4">
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg text-gray-500">Event not found.</p>
        <button onClick={() => router.push("/events")} className="button mt-4">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".event-details-page")}
      className="event-details-page"
    >
      <div className="flex flex-col gap-6 items-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="md:col-span-2">
            <TutorialHighlight
              isHighlighted={shouldHighlight(".event-detail-card")}
              className="event-detail-card"
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex gap-4">
                  <button
                    onClick={handleEditEvent}
                    className="edit-button"
                    title="Edit Event"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="delete-button"
                    title="Delete Event"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="event-detail-info-container">
                <p className="event-detail-info">
                  <strong className="info-label">Date:</strong>
                  <span className="info-text">
                    {extractDate(event.start_date, event.end_date)}
                  </span>
                </p>
                <p className="event-detail-info">
                  <strong className="info-label">Time:</strong>
                  <span className="info-text">
                    {event.start_date && event.end_date
                      ? `${extractTime(event.start_date)} - ${extractTime(event.end_date)}`
                      : "Time not set"}
                  </span>
                </p>
                <p className="event-detail-info">
                  <strong className="info-label">Location:</strong>
                  <span className="info-text">
                    {event.description || "Location not set"}
                  </span>
                </p>
                <p className="event-detail-info">
                  <strong className="info-label">Required Servers:</strong>
                  <span className="info-text">
                    {event.number_of_servers_needed || 0}
                  </span>
                </p>
                <p className="event-detail-info">
                  <strong className="info-label">Required Drivers:</strong>
                  <span className="info-text">
                    {event.number_of_driver_needed || 0}
                  </span>
                </p>
                {event.contact_name && (
                  <p className="event-detail-info">
                    <strong className="info-label">Contact Name:</strong>
                    <span className="info-text">{event.contact_name}</span>
                  </p>
                )}
                {event.contact_email && (
                  <p className="event-detail-info">
                    <strong className="info-label">Contact Email:</strong>
                    <span className="info-text">{event.contact_email}</span>
                  </p>
                )}
                {event.contact_phone && (
                  <p className="event-detail-info">
                    <strong className="info-label">Contact Phone:</strong>
                    <span className="info-text">{event.contact_phone}</span>
                  </p>
                )}
                <p className="event-detail-info">
                  <strong className="info-label">Payment Status:</strong>
                  <span
                    className={`px-2 py-1 rounded text-sm ${event.is_prepaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                  >
                    {event.is_prepaid ? "Prepaid" : "Pending Payment"}
                  </span>
                </p>
                <p className="event-detail-info">
                  <strong className="info-label">Event Status:</strong>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      event.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : event.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {event.status || "Pending"}
                  </span>
                </p>
              </div>
            </TutorialHighlight>
          </div>
        </div>

        {/* Server Warning */}
        {showServerWarning && (
          <div className="w-full">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Not Enough Servers Assigned
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      This event requires {event?.number_of_servers_needed || 0}{" "}
                      servers, but only {serverAssignments.length} are currently
                      assigned. The event status has been set to
                      &quot;Pending&quot; until all required servers are
                      assigned.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Staff and Trucks Buttons */}
        <div className="mt-6 flex gap-4">
          <TutorialHighlight
            isHighlighted={shouldHighlight(".select-employees-button")}
          >
            <button
              className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark select-employees-button"
              onClick={openEmployeeModal}
            >
              Select Employees
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".select-trucks-button")}
          >
            <button
              className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark select-trucks-button"
              onClick={openTruckModal}
            >
              Assign Trucks & Drivers
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".update-payment-button")}
          >
            <button
              className="button bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 update-payment-button"
              onClick={() => handleUpdatePaymentStatus()}
            >
              {event.is_prepaid ? "Mark as Pending Payment" : "Mark as Prepaid"}
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".update-status-buttons")}
          >
            <div className="flex gap-2 update-status-buttons">
              <select
                value={event.status || "Pending"}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="button bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 border-none"
              >
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </TutorialHighlight>
        </div>

        {/* Employee Selection Modal */}
        {isEmployeeModalOpen && (
          <EmployeeSelectionModal
            key="employee-selection-modal"
            isOpen={isEmployeeModalOpen}
            onClose={closeEmployeeModal}
            employees={employees}
            assignedEmployees={assignedEmployees}
            onSaveAssignments={handleSaveEmployeeAssignments}
            employeeFilter={employeeFilter}
            onFilterChange={(filter) => setEmployeeFilter(filter)}
            isLoadingEmployees={isLoadingEmployees}
            event={{
              id: event.id,
              addresses: event.addresses,
              number_of_servers_needed: event.number_of_servers_needed || 0,
              start_date: event.start_date,
              end_date: event.end_date,
            }}
            shouldHighlight={shouldHighlight}
          />
        )}

        {/* Truck Assignment Modal */}
        {isTruckAssignmentModalOpen && (
          <TruckAssignmentModal
            key="truck-assignment-modal"
            isOpen={isTruckAssignmentModalOpen}
            onClose={closeTruckModal}
            trucks={trucks}
            onTruckAssignment={(truckId, driverId) =>
              handleTruckAssignment(truckId, driverId)
            }
            getAssignedDriverForTruck={getAssignedDriverForTruck}
            getAvailableDrivers={getAvailableDrivers}
            isLoadingTrucks={isLoadingTrucks}
            shouldHighlight={shouldHighlight}
            eventStartTime={event?.start_date}
            eventEndTime={event?.end_date}
            eventId={event?.id}
          />
        )}

        {/* Assignments Grid - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Server Assignments Section */}
          <TutorialHighlight
            isHighlighted={shouldHighlight(".assigned-employees-section")}
            className="assigned-employees-section"
          >
            <div className="server-assignments-section">
              <ServerAssignmentsSection
                serverAssignments={serverAssignments}
                onAssignmentRemoved={refreshServerAssignments}
              />
            </div>
          </TutorialHighlight>

          {/* Truck Assignments Section */}
          <TutorialHighlight
            isHighlighted={shouldHighlight(".assigned-trucks-section")}
            className="assigned-trucks-section"
          >
            <div className="truck-assignments-section">
              {truckAssignments.length > 0 ? (
                <TruckAssignmentsSection
                  trucks={trucks}
                  truckAssignments={truckAssignments}
                  employees={employees}
                  shouldHighlight={shouldHighlight}
                  onAssignmentRemoved={refreshTruckAssignments}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">
                    Truck Assignments
                  </h3>
                  <p className="text-gray-500">
                    No trucks assigned to this event yet.
                  </p>
                </div>
              )}
            </div>
          </TutorialHighlight>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <TutorialHighlight
            isHighlighted={shouldHighlight(".edit-event-button")}
          >
            <button
              className="button bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 edit-event-button"
              onClick={handleEditEvent}
            >
              Edit Event
            </button>
          </TutorialHighlight>
          <TutorialHighlight
            isHighlighted={shouldHighlight(".delete-event-button")}
          >
            <button
              className="button bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 delete-event-button"
              onClick={openDeleteModal}
            >
              Delete Event
            </button>
          </TutorialHighlight>
        </div>

        {/* Edit Event Modal */}
        {isEditModalOpen && (
          <EditEventModal
            key="edit-event-modal"
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSubmit={handleEditSubmit}
            formData={editFormData}
            onFormChange={handleEditFormChange}
            onDateChange={handleEditDateChange}
            onEndDateChange={handleEditEndDateChange}
            onTimeChange={handleEditTimeChange}
            onEndTimeChange={handleEditEndTimeChange}
            selectedDate={selectedDate}
            selectedEndDate={selectedEndDate}
            selectedTime={selectedTime}
            selectedEndTime={selectedEndTime}
            isSubmitting={isSubmitting}
            setEditFormData={setEditFormData}
          />
        )}

        {/* Delete Event Confirmation Modal */}
        {isDeleteModalOpen && (
          <DeleteEventModal
            key="delete-event-modal"
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onDelete={handleDeleteEvent}
            shouldHighlight={shouldHighlight}
          />
        )}

        {/* Error Modal */}
        <ErrorModal
          isOpen={isErrorModalOpen}
          onClose={closeErrorModal}
          errors={errorModalErrors}
          title={errorModalTitle}
          type={errorModalType}
        />
      </div>
    </TutorialHighlight>
  );
}
