"use client";
import "../../globals.css";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, ReactElement } from "react";
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
import {
  validateForm,
  ValidationRule,
  validateNumber,
  createValidationRule,
  scrollToFirstError,
  sanitizeFormData,
} from "@/lib/formValidation";

// Import components
import EmployeeSelectionModal from "./components/EmployeeSelectionModal";
import TruckAssignmentModal from "./components/TruckAssignmentModal";
import EditEventModal from "./components/EditEventModal";
import DeleteEventModal from "./components/DeleteEventModal";
import AssignedEmployeesSection from "./components/AssignedEmployeesSection";
import TruckAssignmentsSection from "./components/TruckAssignmentsSection";

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
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState<boolean>(false);
  const [isTruckAssignmentModalOpen, setTruckAssignmentModalOpen] =
    useState<boolean>(false);
  const [isEditModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(true);
  const [isLoadingTrucks, setIsLoadingTrucks] = useState<boolean>(true);
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(true);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { shouldHighlight } = useTutorial();

  // Edit form state
  const [editFormData, setEditFormData] = useState<EventFormData>({
    name: "",
    date: "",
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
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee filter state
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  // Fetch event details from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;

      try {
        setIsLoadingEvent(true);
        setError(null);
        const eventData = await eventsApi.getEventById(id as string);
        setEvent(eventData);
      } catch (err) {
        console.error("Error fetching event:", err);
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
      } catch (err) {
        console.error("Error fetching data:", err);
        setIsLoadingEmployees(false);
        setIsLoadingTrucks(false);
      }
    };

    fetchData();
  }, []);

  // Fetch truck assignments when event is loaded
  useEffect(() => {
    const fetchTruckAssignments = async () => {
      if (!event?.id) return;

      try {
        const assignments =
          await truckAssignmentsApi.getTruckAssignmentsByEventId(event.id);
        setTruckAssignments(assignments);
      } catch (err) {
        console.error("Error fetching truck assignments:", err);
      }
    };

    fetchTruckAssignments();
  }, [event?.id]);

  // Update assigned employees when event or employees change
  useEffect(() => {
    if (event && employees.length > 0) {
      // For now, we'll show all employees since assignedStaff is not in the Supabase schema yet
      // This will need to be updated when assignments are properly implemented
      setAssignedEmployees([]);
    }
  }, [event, employees]);

  const handleEmployeeSelection = (employee: Employee) => {
    if (assignedEmployees.some((e) => e.employee_id === employee.employee_id)) {
      setAssignedEmployees(
        assignedEmployees.filter((e) => e.employee_id !== employee.employee_id)
      );
    } else if (
      event &&
      assignedEmployees.length < (event.number_of_servers_needed || 0)
    ) {
      setAssignedEmployees([...assignedEmployees, employee]);
    }
  };

  const handleTruckAssignment = async (
    truckId: string,
    driverId: string | null
  ) => {
    if (!event?.id) return;

    try {
      const existingAssignment = truckAssignments.find(
        (assignment) => assignment.truck_id === truckId
      );

      if (existingAssignment) {
        if (driverId === null) {
          // Remove assignment
          await truckAssignmentsApi.deleteTruckAssignment(
            existingAssignment.id
          );
          setTruckAssignments(
            truckAssignments.filter(
              (assignment) => assignment.truck_id !== truckId
            )
          );
        } else {
          // Update existing assignment
          const updatedAssignment =
            await truckAssignmentsApi.updateTruckAssignment(
              existingAssignment.id,
              { driver_id: driverId }
            );
          setTruckAssignments(
            truckAssignments.map((assignment) =>
              assignment.truck_id === truckId ? updatedAssignment : assignment
            )
          );
        }
      } else if (driverId !== null) {
        // Create new assignment
        const newAssignment = await truckAssignmentsApi.createTruckAssignment({
          truck_id: truckId,
          driver_id: driverId,
          event_id: event.id,
          start_time: event.start_date || new Date().toISOString(),
          end_time: event.end_date || new Date().toISOString(),
        });
        setTruckAssignments([...truckAssignments, newAssignment]);
      }
    } catch (err) {
      console.error("Error handling truck assignment:", err);
      alert("Failed to update truck assignment. Please try again.");
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

  const handleDeleteEvent = async () => {
    if (!event?.id) return;

    try {
      // Delete truck assignments first
      await truckAssignmentsApi.deleteTruckAssignmentsByEventId(event.id);

      // Delete the event
      await eventsApi.deleteEvent(event.id);

      // Navigate back to events page
      router.push("/events");
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event. Please try again.");
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!event?.id) return;

    try {
      const updatedEvent = await eventsApi.updateEvent(event.id, {
        is_prepaid: !event.is_prepaid,
      });
      setEvent(updatedEvent);
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Failed to update payment status. Please try again.");
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
    setSelectedTime(startDate);
    setSelectedEndTime(endDate);
    setEditModalOpen(true);
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
    setFormErrors([]);

    if (!event?.id) {
      console.error("Event ID is missing");
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
        (value: unknown) => value instanceof Date || value === null,
        "Please select a valid date."
      ),
      createValidationRule(
        "time",
        true,
        (value: unknown) => value instanceof Date || value === null,
        "Please select a valid start time."
      ),
      createValidationRule(
        "endTime",
        true,
        (value: unknown) => value instanceof Date || value === null,
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
      const errorMessages = validationErrors.map((error) => error.message);
      setFormErrors(errorMessages);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedEvent = await eventsApi.updateEvent(event.id, {
        title: sanitizedData.name,
        start_date: `${sanitizedData.date}T${sanitizedData.time}`,
        end_date: `${sanitizedData.date}T${sanitizedData.endTime}`,
        description: sanitizedData.location,
        number_of_servers_needed: parseInt(sanitizedData.requiredServers, 10),
        contact_name: sanitizedData.contactName || null,
        contact_email: sanitizedData.contactEmail || null,
        contact_phone: sanitizedData.contactPhone || null,
        is_prepaid: editFormData.isPrepaid,
      });

      setEvent(updatedEvent);
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setFormErrors([errorMessage]);
      setShowErrorModal(true);
      setIsSubmitting(false);
    }
  };

  const handleScrollToFirstError = () => {
    const sanitizedData = sanitizeFormData(editFormData);

    const validationRules: ValidationRule[] = [
      createValidationRule("name", true, undefined, "Event name is required."),
      createValidationRule(
        "date",
        true,
        (value: unknown) => value instanceof Date || value === null,
        "Please select a valid date."
      ),
      createValidationRule(
        "time",
        true,
        (value: unknown) => value instanceof Date || value === null,
        "Please select a valid start time."
      ),
      createValidationRule(
        "endTime",
        true,
        (value: unknown) => value instanceof Date || value === null,
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
      scrollToFirstError(validationErrors);
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
    <div className="flex flex-col gap-6 items-center w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <div className="md:col-span-2">
          <div className="event-detail-card">
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
                  onClick={() => setDeleteModalOpen(true)}
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
            </div>
          </div>
        </div>
      </div>

      {/* Assign Staff and Trucks Buttons */}
      <div className="mt-6 flex gap-4">
        <TutorialHighlight
          isHighlighted={shouldHighlight(".select-employees-button")}
        >
          <button
            className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark select-employees-button"
            onClick={() => setEmployeeModalOpen(true)}
          >
            Select Employees
          </button>
        </TutorialHighlight>
        <TutorialHighlight
          isHighlighted={shouldHighlight(".select-trucks-button")}
        >
          <button
            className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark select-trucks-button"
            onClick={() => setTruckAssignmentModalOpen(true)}
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
      </div>

      {/* Employee Selection Modal */}
      {isEmployeeModalOpen && (
        <EmployeeSelectionModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setEmployeeModalOpen(false)}
          employees={employees}
          assignedEmployees={assignedEmployees}
          onEmployeeSelection={handleEmployeeSelection}
          employeeFilter={employeeFilter}
          onFilterChange={(filter) => setEmployeeFilter(filter)}
          isLoadingEmployees={isLoadingEmployees}
          event={{
            addresses: event.addresses,
            number_of_servers_needed: event.number_of_servers_needed || 0,
          }}
          shouldHighlight={shouldHighlight}
        />
      )}

      {/* Truck Assignment Modal */}
      {isTruckAssignmentModalOpen && (
        <TruckAssignmentModal
          isOpen={isTruckAssignmentModalOpen}
          onClose={() => setTruckAssignmentModalOpen(false)}
          trucks={trucks}
          onTruckAssignment={(truckId, driverId) =>
            handleTruckAssignment(truckId, driverId)
          }
          getAssignedDriverForTruck={getAssignedDriverForTruck}
          getAvailableDrivers={getAvailableDrivers}
          isLoadingTrucks={isLoadingTrucks}
          shouldHighlight={shouldHighlight}
        />
      )}

      {/* Assigned Employees Section */}
      {assignedEmployees.length > 0 && (
        <AssignedEmployeesSection
          assignedEmployees={assignedEmployees}
          shouldHighlight={shouldHighlight}
        />
      )}

      {/* Truck Assignments Section */}
      {truckAssignments.length > 0 && (
        <TruckAssignmentsSection
          truckAssignments={truckAssignments}
          trucks={trucks}
          employees={employees}
          shouldHighlight={shouldHighlight}
        />
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleEditSubmit}
          formData={editFormData}
          onFormChange={handleEditFormChange}
          onDateChange={handleEditDateChange}
          onTimeChange={handleEditTimeChange}
          onEndTimeChange={handleEditEndTimeChange}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedEndTime={selectedEndTime}
          isSubmitting={isSubmitting}
          setEditFormData={setEditFormData}
          formErrors={formErrors}
          showErrorModal={showErrorModal}
          onCloseErrorModal={() => setShowErrorModal(false)}
          onScrollToFirstError={handleScrollToFirstError}
        />
      )}

      {/* Delete Event Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteEventModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onDelete={handleDeleteEvent}
          shouldHighlight={shouldHighlight}
        />
      )}
    </div>
  );
}
