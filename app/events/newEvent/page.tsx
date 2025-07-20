"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
  useCallback,
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
  createValidationRule,
  handleAutofill,
} from "../../../lib/formValidation";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import { calculateStraightLineDistance } from "@/lib/utils/distance";

// Function to combine date and time exactly as entered, preserving local time
const combineDateTime = (date: string, time: string): string => {
  // Create a datetime string that preserves the exact time as entered
  // Format: YYYY-MM-DDTHH:MM:SS (local time, no timezone conversion)
  // Store as local time string without timezone conversion
  return `${date}T${time}:00`;
};

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
  const [truckAvailabilityReasons, setTruckAvailabilityReasons] = useState<
    Map<string, string>
  >(new Map());
  const [isLoadingTruckAvailability, setIsLoadingTruckAvailability] =
    useState(false);
  const [hasCheckedTruckAvailability, setHasCheckedTruckAvailability] =
    useState(false);
  const [driversWithAvailability, setDriversWithAvailability] = useState<
    Record<
      string,
      Array<{ driver: Employee; isAvailable: boolean; reason: string }>
    >
  >({});

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

  // State for sorted employees
  const [sortedEmployees, setSortedEmployees] = useState<Employee[]>([]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        date: date.toISOString().split("T")[0],
        endDate: date.toISOString().split("T")[0], // Set end date to same as start date
      }));
      setSelectedEndDate(date); // Also update the end date picker
    }
    // Clear sorted employees when date changes so they can be re-sorted with new availability
    setSortedEmployees([]);
    // Reset truck availability check when date changes
    setHasCheckedTruckAvailability(false);
    setTruckAvailabilityReasons(new Map());
  };

  const handleEndDateChange = (date: Date | null) => {
    setSelectedEndDate(date);
    if (date) {
      setFormData((prev) => ({
        ...prev,
        endDate: date.toISOString().split("T")[0],
      }));
    }
    // Clear sorted employees when end date changes
    setSortedEmployees([]);
    // Reset truck availability check when end date changes
    setHasCheckedTruckAvailability(false);
    setTruckAvailabilityReasons(new Map());
  };

  const handleTimeChange = (time: Date | null) => {
    setSelectedTime(time);
    if (time) {
      // Extract time exactly as displayed in the picker (HH:MM format)
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      setFormData((prev) => ({
        ...prev,
        time: timeString,
      }));
    }
    // Clear sorted employees when time changes
    setSortedEmployees([]);
    // Reset truck availability check when time changes
    setHasCheckedTruckAvailability(false);
    setTruckAvailabilityReasons(new Map());
  };

  const handleEndTimeChange = (time: Date | null) => {
    setSelectedEndTime(time);
    if (time) {
      // Extract time exactly as displayed in the picker (HH:MM format)
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;

      setFormData((prev) => ({
        ...prev,
        endTime: timeString,
      }));
    }
    // Clear sorted employees when end time changes
    setSortedEmployees([]);
    // Reset truck availability check when end time changes
    setHasCheckedTruckAvailability(false);
    setTruckAvailabilityReasons(new Map());
  };

  const handleLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    console.log("handleLocationChange called with:", address, coords);

    // Parse the address components from the full address string
    const parseAddress = (fullAddress: string) => {
      const parts = fullAddress.split(",").map((part) => part.trim());

      if (parts.length >= 2) {
        const streetPart = parts[0];
        const city = parts[1];
        const postalCode = parts[2] || "";

        // Extract street number and name from street part
        const streetParts = streetPart.split(" ");
        const streetNumber = streetParts[0] || "";
        const direction = ["NW", "NE", "SW", "SE"].includes(
          streetParts[streetParts.length - 1]
        )
          ? streetParts[streetParts.length - 1]
          : "";
        const streetName = direction
          ? streetParts.slice(1, -1).join(" ")
          : streetParts.slice(1).join(" ");

        return {
          street:
            `${streetNumber} ${streetName}${direction ? " " + direction : ""}`.trim(),
          city: city,
          province: "Alberta", // Default for Calgary area
          postalCode: postalCode,
          country: "Canada", // Default
        };
      }

      // Fallback if parsing fails
      return {
        street: fullAddress,
        city: "Calgary",
        province: "Alberta",
        postalCode: "",
        country: "Canada",
      };
    };

    const addressComponents = parseAddress(address);

    setFormData((prev) => {
      const updated = {
        ...prev,
        location: address,
        street: addressComponents.street,
        city: addressComponents.city,
        province: addressComponents.province,
        postalCode: addressComponents.postalCode,
        country: addressComponents.country,
      };
      console.log("Updated formData with address components:");
      return updated;
    });
    setCoordinates(coords);
  };

  const handleTruckAssignment = (truckId: string, driverId: string | null) => {
    const existingAssignment = truckAssignments.find(
      (assignment) => assignment.truck_id === truckId
    );

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

        alert(
          `${driverName} is already assigned to ${truckName} for this event. A driver cannot be assigned to multiple trucks.`
        );
        return;
      }
    }

    if (existingAssignment) {
      if (driverId === null) {
        // Remove assignment if no driver selected
        setTruckAssignments(
          truckAssignments.filter(
            (assignment) => assignment.truck_id !== truckId
          )
        );
        // Also remove from formData.trucks
        setFormData((prev) => ({
          ...prev,
          trucks: prev.trucks.filter((id) => id !== truckId),
        }));
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

      setFormData((prev) => ({
        ...prev,
        trucks: [...prev.trucks, truckId],
      }));
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
        setFormData((prev) => ({
          ...prev,
          trucks: [...prev.trucks, truckId],
        }));
      }
    } else {
      // When truck is deselected, remove assignment
      handleTruckAssignment(truckId, null);
    }
  };

  // New function to reset all truck selections
  const handleResetTruckSelections = () => {
    setTruckAssignments([]);
    setFormData((prev) => ({
      ...prev,
      trucks: [],
    }));
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

  // Function to load available drivers using the centralized availability function
  const loadAvailableDrivers = useCallback(async () => {
    // If we have event date/time, use the centralized availability function
    if (formData.date && formData.time && formData.endTime) {
      setIsLoadingTruckAvailability(true);
      try {
        const eventStartDate = new Date(`${formData.date}T${formData.time}`);
        const eventEndDate = new Date(
          `${formData.endDate}T${formData.endTime}`
        );

        // Get available drivers and managers separately, then combine
        const [availableDrivers, availableManagers] = await Promise.all([
          employeeAvailabilityApi.getAvailableEmployees(
            "Driver",
            eventStartDate.toISOString(),
            eventEndDate.toISOString(),
            formData.location
          ),
          employeeAvailabilityApi.getAvailableEmployees(
            "Manager",
            eventStartDate.toISOString(),
            eventEndDate.toISOString(),
            formData.location
          ),
        ]);

        // Combine and set all available drivers and managers
        setDriversWithAvailability((prev) => ({
          ...prev,
          ...availableDrivers.reduce<
            Record<
              string,
              Array<{ driver: Employee; isAvailable: boolean; reason: string }>
            >
          >((acc, driver) => {
            acc[driver.employee_id] = [
              { driver, isAvailable: true, reason: "" },
            ];
            return acc;
          }, {}),
          ...availableManagers.reduce<
            Record<
              string,
              Array<{ driver: Employee; isAvailable: boolean; reason: string }>
            >
          >((acc, manager) => {
            acc[manager.employee_id] = [
              { driver: manager, isAvailable: true, reason: "" },
            ];
            return acc;
          }, {}),
        }));
      } catch (error) {
        console.error("Error checking driver availability:", error);
        // Fallback to static availability check
        const fallbackDrivers = employees.filter(
          (emp) =>
            (emp.employee_type === "Driver" ||
              emp.employee_type === "Manager") &&
            emp.is_available
        );
        setDriversWithAvailability(
          fallbackDrivers.reduce<
            Record<
              string,
              Array<{ driver: Employee; isAvailable: boolean; reason: string }>
            >
          >((acc, driver) => {
            acc[driver.employee_id] = [
              { driver, isAvailable: true, reason: "" },
            ];
            return acc;
          }, {})
        );
      } finally {
        setIsLoadingTruckAvailability(false);
      }
    } else {
      // If no date/time yet, use static availability check
      const staticDrivers = employees.filter(
        (emp) =>
          (emp.employee_type === "Driver" || emp.employee_type === "Manager") &&
          emp.is_available
      );
      setDriversWithAvailability(
        staticDrivers.reduce<
          Record<
            string,
            Array<{ driver: Employee; isAvailable: boolean; reason: string }>
          >
        >((acc, driver) => {
          acc[driver.employee_id] = [{ driver, isAvailable: true, reason: "" }];
          return acc;
        }, {})
      );
    }
  }, [
    formData.date,
    formData.time,
    formData.endTime,
    formData.endDate,
    formData.location,
    employees,
  ]);

  // Check truck availability when date/time changes
  const checkTruckAvailability = async () => {
    if (
      !formData.date ||
      !formData.time ||
      !formData.endTime ||
      trucks.length === 0
    ) {
      return;
    }

    setIsLoadingTruckAvailability(true);
    try {
      const eventStartDate = `${formData.date}T${formData.time}`;
      const eventEndDate = `${formData.endDate}T${formData.endTime}`;

      // Use the reusable function to check all trucks availability
      const trucksWithAvailability = await trucksApi.truckAvailabilityCheck(
        eventStartDate,
        eventEndDate
      );

      // Create maps for availability reasons and status
      const newAvailabilityReasons = new Map<string, string>();
      const newTruckAvailability = new Map<string, boolean>();

      trucksWithAvailability.forEach((truck) => {
        newTruckAvailability.set(truck.id, truck.isAvailable);
        if (!truck.isAvailable && truck.availabilityReason) {
          newAvailabilityReasons.set(truck.id, truck.availabilityReason);
        }
      });

      setTruckAvailabilityReasons(newAvailabilityReasons);

      // Update truck availability status in the trucks array
      setTrucks((prevTrucks) =>
        prevTrucks.map((truck) => ({
          ...truck,
          is_available:
            newTruckAvailability.get(truck.id) ?? truck.is_available,
        }))
      );

      // Auto-remove conflicting trucks from selection
      const conflictingTruckIds = Array.from(newAvailabilityReasons.keys());
      if (conflictingTruckIds.length > 0) {
        const updatedAssignments = truckAssignments.filter(
          (assignment) => !conflictingTruckIds.includes(assignment.truck_id)
        );
        const updatedTruckIds = formData.trucks.filter(
          (truckId) => !conflictingTruckIds.includes(truckId)
        );

        setTruckAssignments(updatedAssignments);
        setFormData((prev) => ({
          ...prev,
          trucks: updatedTruckIds,
        }));
      }

      setHasCheckedTruckAvailability(true);
    } catch (error) {
      console.error("Error checking truck availability:", error);
      setTruckAvailabilityReasons(new Map());
    } finally {
      setIsLoadingTruckAvailability(false);
    }
  };

  // Load available drivers when component mounts or when date/time changes
  useEffect(() => {
    loadAvailableDrivers();
  }, [
    formData.date,
    formData.time,
    formData.endTime,
    formData.location,
    employees,
    loadAvailableDrivers,
  ]);

  // Load driver availability for each truck when event time or employees change
  useEffect(() => {
    const loadDriversAvailability = async () => {
      if (!formData.date || !formData.time || !formData.endTime) return;
      const eventStart = `${formData.date}T${formData.time}`;
      const eventEnd = `${formData.endDate}T${formData.endTime}`;
      const truckDriverMap: Record<
        string,
        Array<{ driver: Employee; isAvailable: boolean; reason: string }>
      > = {};
      for (const truck of trucks) {
        truckDriverMap[truck.id] = await Promise.all(
          employees
            .filter(
              (emp) =>
                emp.employee_type === "Driver" ||
                emp.employee_type === "Manager"
            )
            .map(async (driver) => {
              const availability =
                await employeeAvailabilityApi.checkEmployeeAvailability(
                  driver,
                  eventStart,
                  eventEnd,
                  undefined // No eventId yet
                );
              return {
                driver,
                isAvailable: availability.isAvailable,
                reason: availability.reason,
              };
            })
        );
      }
      setDriversWithAvailability(truckDriverMap);
    };
    loadDriversAvailability();
  }, [
    formData.date,
    formData.time,
    formData.endTime,
    formData.endDate,
    trucks,
    employees,
  ]);

  // Remove the automatic truck availability checking
  // useEffect(() => {
  //   checkTruckAvailability();
  // }, [formData.date, formData.time, formData.endTime, trucks]);

  // Handler for Check Address button (to be passed to AddressForm)
  const handleCheckAddress = () => {
    // Only update state if AddressForm validates
    const valid = addressFormRef.current?.validate() ?? false;
    if (valid) {
      // Only check truck availability if we have the required date/time fields
      if (formData.date && formData.time && formData.endTime) {
        checkTruckAvailability();
      }

      // Start sorting employees and checking truck availability if we have coordinates (don't await, run in background)
      if (coordinates) {
        // Use setTimeout to run the sorting in the background
        setTimeout(async () => {
          try {
            // Removed serverMessage and truckMessage variables since they are no longer used

            // Check server availability
            const availableServers = employees.filter(
              (emp) =>
                emp.employee_type === "Server" && emp.is_available === true
            );

            if (availableServers.length > 0) {
              // If we have date and time, use availability checking with distance + wage sorting
              if (formData.date && formData.time && formData.endTime) {
                // Use the optimized getAvailableServers function which includes distance + wage sorting
                const eventStartDate = `${formData.date}T${formData.time}`;
                const eventEndDate = `${formData.endDate}T${formData.endTime}`;
                const sortedAvailableServers =
                  await employeeAvailabilityApi.getAvailableServers(
                    eventStartDate,
                    eventEndDate,
                    formData.location,
                    undefined, // excludeEventId
                    coordinates // Pass the coordinates directly
                  );
                setSortedEmployees(sortedAvailableServers);
              } else {
                // If no date/time yet, use distance + wage sorting without availability checking
                const serversWithDistance = await Promise.all(
                  availableServers.map(async (server) => {
                    let distance = 0;
                    if (
                      server.addresses?.latitude &&
                      server.addresses?.longitude
                    ) {
                      const employeeCoords = {
                        lat: parseFloat(server.addresses.latitude),
                        lng: parseFloat(server.addresses.longitude),
                      };

                      // Get event coordinates
                      const { getCoordinates } = await import(
                        "@/app/AlgApi/distance"
                      );
                      const eventCoords = await getCoordinates(
                        formData.location
                      );

                      // Use our distance API
                      try {
                        const coord1Str = `${employeeCoords.lat.toFixed(6)},${employeeCoords.lng.toFixed(6)}`;
                        const coord2Str = `${eventCoords.lat.toFixed(6)},${eventCoords.lng.toFixed(6)}`;

                        const response = await fetch(
                          `/api/route/distance?coord1=${encodeURIComponent(coord1Str)}&coord2=${encodeURIComponent(coord2Str)}`,
                          { method: "GET" }
                        );

                        if (response.ok) {
                          const data = await response.json();
                          if (data.success) {
                            distance = data.distance;
                          }
                        }
                      } catch (error) {
                        console.warn(
                          `Failed to calculate distance for ${server.first_name} ${server.last_name}:`,
                          error
                        );
                        // Use straight-line distance calculation
                        distance = calculateStraightLineDistance(
                          employeeCoords,
                          eventCoords
                        );
                      }
                    }
                    return { ...server, distance };
                  })
                );

                // Sort by distance first, then by wage if within 5km, with employees without addresses last
                const sortedByDistanceAndWage = serversWithDistance.sort(
                  (a, b) => {
                    // First priority: employees without addresses go last
                    if (a.distance === Infinity && b.distance !== Infinity) {
                      return 1; // a goes after b
                    }
                    if (a.distance !== Infinity && b.distance === Infinity) {
                      return -1; // a goes before b
                    }
                    if (a.distance === Infinity && b.distance === Infinity) {
                      // Both have no addresses, sort by wage (lower first)
                      return (a.currentWage || 0) - (b.currentWage || 0);
                    }

                    // Both have addresses, check if within 5km of each other
                    if (Math.abs(a.distance - b.distance) <= 5) {
                      // If within 5km, sort by wage (lower first)
                      return (a.currentWage || 0) - (b.currentWage || 0);
                    }
                    // Otherwise sort by distance (closest first)
                    return a.distance - b.distance;
                  }
                );
                setSortedEmployees(sortedByDistanceAndWage);
              }
            }

            // Truck availability will be checked manually via the "Check Truck Availability" button
            // Removed truckMessage variable since it is no longer used
          } catch (error) {
            console.error("Error sorting employees:", error);
          }
        }, 0);
      }
    } else {
      // setIsAddressValid(false); // This line is removed
    }
    return valid;
  };

  // Handler for address errors from AddressForm
  const handleAddressError = (errors: ValidationError[]) => {
    setValidationErrors(errors);
    setShowErrorModal(true);
  };

  const validateFormData = (): ValidationError[] => {
    console.log("validateFormData - current formData:", formData);
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
        null
      ),
      createValidationRule(
        "requiredServers",
        false, // Make it optional
        (value: unknown) =>
          !value || // Allow empty/0 values
          ((typeof value === "string" || typeof value === "number") &&
            validateNumber(value, 0)), // Allow 0 or more
        "Number of servers must be 0 or greater.",
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

    // Check truck assignments - only require at least one truck, drivers are optional
    if (truckAssignments.length === 0) {
      errors.push({
        field: "trucks",
        message: "Please select at least one truck for this event.",
        element: null,
      });
    }

    // Check if address was validated (coordinates exist)
    if (!coordinates) {
      errors.push({
        field: "location",
        message:
          "Please validate your address using the 'Check Address' button.",
        element: null,
      });
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Force a re-render to ensure we have the latest state
    await new Promise((resolve) => setTimeout(resolve, 0));

    const validationErrors = validateFormData();

    if (validationErrors.length > 0) {
      setValidationErrors(validationErrors);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the required number of servers, default to 0 if empty
      const requiredServers = parseInt(formData.requiredServers) || 0;

      // Use pre-sorted employees if available, otherwise get available servers
      let availableServers: Employee[];
      if (sortedEmployees.length > 0) {
        // Check if the pre-sorted employees were availability-checked (by checking if they have distance property)
        const hasDistanceProperty = sortedEmployees.some(
          (emp) => "distance" in emp
        );

        if (hasDistanceProperty) {
          // Pre-sorted employees were only sorted by distance, need to re-check availability
          availableServers = await assignmentsApi.getAvailableServers(
            formData.date,
            formData.time,
            formData.endTime,
            formData.location
          );
        } else {
          // Pre-sorted employees were already availability-checked
          availableServers = sortedEmployees;
        }
      } else {
        // Fallback to the original method if no pre-sorted employees
        availableServers = await assignmentsApi.getAvailableServers(
          formData.date,
          formData.time,
          formData.endTime,
          formData.location
        );
        console.log(
          `Fetched ${availableServers.length} available servers using original method`
        );
      }

      // Default event status
      let eventStatus = "Scheduled";

      // Set to Pending if not enough servers (only if servers are required)
      if (requiredServers > 0 && availableServers.length < requiredServers) {
        eventStatus = "Pending";
      }

      // Set to Pending if any trucks don't have drivers assigned
      const trucksWithoutDrivers = truckAssignments.filter(
        (assignment) => !assignment.driver_id
      );
      if (trucksWithoutDrivers.length > 0) {
        eventStatus = "Pending";
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
      const startDateTime = combineDateTime(formData.date, formData.time);
      const endDateTime = combineDateTime(formData.endDate, formData.endTime);

      const eventData = {
        title: capitalizeTitle(formData.name),
        start_date: startDateTime,
        end_date: endDateTime,
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
          start_time: combineDateTime(formData.date, assignment.start_time),
          end_time: combineDateTime(formData.endDate, assignment.end_time),
        });
      }

      // Auto-assign servers (closest ones first) - using availability-checked servers
      // Only assign servers if requiredServers > 0
      if (requiredServers > 0) {
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
      }

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
            <label htmlFor="requiredServers" className="input-label">
              Required Servers (optional, defaults to 0)
            </label>
            <input
              ref={requiredServersRef}
              type="number"
              id="requiredServers"
              name="requiredServers"
              value={formData.requiredServers}
              onChange={handleChange}
              min="0"
              placeholder="0"
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
                    setFormData((prev) => ({
                      ...prev,
                      isPrepaid: e.target.checked,
                    }))
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

            {/* Check Availability Button - positioned under the header */}
            <div className="mb-4">
              <button
                type="button"
                onClick={async () => {
                  await checkTruckAvailability();
                  await loadAvailableDrivers();
                }}
                disabled={
                  isLoadingTruckAvailability ||
                  !formData.date ||
                  !formData.time ||
                  !formData.endTime
                }
                className="btn btn-primary"
              >
                {isLoadingTruckAvailability ? (
                  <>
                    <div
                      className="loading-spinner"
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginRight: "0.5rem",
                      }}
                    ></div>
                    Checking Availability...
                  </>
                ) : (
                  "Check Truck & Driver Availability"
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Click to check both truck and driver availability for the
                selected date and time
              </p>
            </div>

            {/* Warning message if fields are missing */}
            {(!formData.date || !formData.time || !formData.endTime) && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please fill in the Date, Time, and End Time fields above to
                  enable availability checking
                </p>
              </div>
            )}

            {/* Show availability status if checked */}
            {hasCheckedTruckAvailability && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-blue-800">
                    ✅ Truck availability has been checked for {formData.date}{" "}
                    at {formData.time}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetTruckSelections}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Reset All Selections
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-3">
              Check the boxes for trucks you want to include in this event, then
              assign a driver to each selected truck.
              {hasCheckedTruckAvailability && (
                <span className="block mt-1 text-xs text-blue-600">
                  💡 Unavailable trucks have been automatically removed from
                  your selection.
                </span>
              )}
            </p>

            <div
              className={`truck-assignment-list space-y-4 ${isLoadingTrucks || isLoadingTruckAvailability ? "loading" : ""}`}
            >
              {isLoadingTrucks || isLoadingTruckAvailability ? (
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
                  .sort((a, b) => {
                    const isSelectedA = truckAssignments.some(
                      (assignment) => assignment.truck_id === a.id
                    );
                    const isSelectedB = truckAssignments.some(
                      (assignment) => assignment.truck_id === b.id
                    );

                    // First priority: selected trucks first
                    if (isSelectedA && !isSelectedB) return -1;
                    if (!isSelectedA && isSelectedB) return 1;

                    // Second priority: availability (available trucks first)
                    if (a.is_available && !b.is_available) return -1;
                    if (!a.is_available && b.is_available) return 1;

                    // Third priority: alphabetical by name
                    return a.name.localeCompare(b.name);
                  })
                  .map((truck) => {
                    const assignedDriver = getAssignedDriverForTruck(truck.id);
                    const isTruckSelected = truckAssignments.some(
                      (assignment) => assignment.truck_id === truck.id
                    );
                    const availabilityReason = truckAvailabilityReasons.get(
                      truck.id
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
                              disabled={
                                hasCheckedTruckAvailability &&
                                !truck.is_available
                              }
                            />
                            <label
                              htmlFor={`truck-${truck.id}`}
                              className={`font-semibold text-lg ${hasCheckedTruckAvailability && !truck.is_available ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                            >
                              {truck.name}
                            </label>
                          </div>
                          {hasCheckedTruckAvailability ? (
                            <span
                              className={`px-2 py-1 rounded text-sm ${
                                truck.is_available
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {truck.is_available ? "Available" : "Unavailable"}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-sm bg-gray-100 text-gray-600">
                              Not Checked
                            </span>
                          )}
                        </div>
                        {hasCheckedTruckAvailability &&
                          !truck.is_available &&
                          availabilityReason && (
                            <div className="text-xs text-red-600 mb-2">
                              ⚠️ {availabilityReason}
                            </div>
                          )}

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
                              {(driversWithAvailability[truck.id] || []).map(
                                ({ driver, isAvailable, reason }) => {
                                  // Check if driver is already assigned to another truck for this event
                                  const isAlreadyAssigned =
                                    truckAssignments.some(
                                      (assignment) =>
                                        assignment.driver_id ===
                                          driver.employee_id &&
                                        assignment.truck_id !== truck.id
                                    );

                                  let displayText = `${driver.first_name} ${driver.last_name} (${driver.employee_type})`;
                                  let textColor = "black";

                                  if (isAlreadyAssigned) {
                                    displayText += ` - Already assigned to another truck for this event`;
                                    textColor = "red";
                                  } else if (!isAvailable) {
                                    displayText += ` - Not available: ${reason}`;
                                    textColor = "red";
                                  } else {
                                    textColor = "green";
                                  }

                                  return (
                                    <option
                                      key={driver.employee_id}
                                      value={driver.employee_id}
                                      style={{ color: textColor }}
                                      disabled={isAlreadyAssigned}
                                    >
                                      {displayText}
                                    </option>
                                  );
                                }
                              )}
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
