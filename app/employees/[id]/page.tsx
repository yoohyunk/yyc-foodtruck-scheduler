"use client";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
  ReactElement,
  useRef,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { EmployeeAvailability, EmployeeFormData } from "@/app/types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import ErrorModal from "../../components/ErrorModal";
import { useAuth } from "@/contexts/AuthContext";
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
import { addressesApi } from "@/lib/supabase/addresses";
import { employeesApi } from "@/lib/supabase/employees";
import { wagesApi } from "@/lib/supabase/wages";
import { employeeAvailabilityApi } from "@/lib/supabase/employeeAvailability";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../components/ClientLayoutContent";
import { assignmentsApi } from "@/lib/supabase/assignments";
import { format } from "date-fns";

export default function EditEmployeePage(): ReactElement {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { shouldHighlight } = useTutorial();
  const addressFormRef = useRef<AddressFormRef>(null);
  const {
    employeeAvailability,
    formAvailability,
    handleAvailabilityChange,
    handleUpsertAvailability,
    clearAvailability,
    selectAllAvailability,
  } = useAvailability(id);
  const [showAssignmentWarning, setShowAssignmentWarning] = useState(false);
  type AssignmentWithEvent = {
    id: string;
    employee_id: string;
    event_id: string;
    start_date: string;
    end_date: string;
    events: {
      id: string;
      title: string;
      start_date: string;
      end_date: string;
    };
  };
  type TruckAssignment = {
    id: string;
    driver_id: string;
    event_id: string;
    start_time: string;
    end_time: string;
  };
  const [futureAssignments, setFutureAssignments] = useState<
    AssignmentWithEvent[]
  >([]);
  const [futureTruckAssignments, setFutureTruckAssignments] = useState<
    TruckAssignment[]
  >([]);
  const [pendingInactiveUpdate, setPendingInactiveUpdate] = useState<
    null | (() => Promise<void>)
  >(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    address: "",
    role: "",
    email: "",
    phone: "",
    wage: "",
    isAvailable: false,
    // Address fields
    street: "",
    city: "",
    province: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
  });

  // Refs for form fields
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const wageRef = useRef<HTMLInputElement>(null);

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Set up autofill detection for all form fields
  useEffect(() => {
    // Only set up autofill detection after loading is complete
    if (isLoading) return;

    const fields = [
      firstNameRef,
      lastNameRef,
      roleRef,
      emailRef,
      phoneRef,
      wageRef,
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
  }, [isLoading]);

  // Fetch employee details
  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      try {
        // Get employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select(
            `
            *,
            addresses!left(*)
          `
          )
          .eq("employee_id", id)
          .single();

        if (employeeError) {
          console.error("Error fetching employee:", employeeError);
          setIsLoading(false);
          return;
        }

        if (!employeeData) {
          console.error("Employee not found");
          setIsLoading(false);
          return;
        }

        // Get wage data - get the most recent wage record
        const { data: wageData, error: wageError } = await supabase
          .from("wage")
          .select("*")
          .eq("employee_id", id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (wageError) {
          console.error("Error fetching wage data:", wageError);
        }

        // If no wage data found, log it
        if (!wageData) {
          console.log("No wage data found for employee:", id);
        }

        // Format address
        const address = employeeData.addresses
          ? `${employeeData.addresses.street}, ${employeeData.addresses.city}, ${employeeData.addresses.province}`
          : "";

        setFormData({
          first_name: employeeData.first_name || "",
          last_name: employeeData.last_name || "",
          address: address,
          role: employeeData.employee_type || "",
          email: employeeData.user_email || "",
          phone: employeeData.user_phone || "",
          wage: wageData?.hourly_wage ? String(wageData.hourly_wage) : "",
          isAvailable: employeeData.is_available || false,

          // TODO (yoohyun.kim): use employeeAvailability to set availability and render
          // correct form states
          availability: (employeeData.availability as string[]) || [],
          // Address fields
          street: employeeData.addresses?.street || "",
          city: employeeData.addresses?.city || "",
          province: employeeData.addresses?.province || "",
          postalCode: employeeData.addresses?.postal_code || "",
          country: employeeData.addresses?.country || "",
          latitude: employeeData.addresses?.latitude || "",
          longitude: employeeData.addresses?.longitude || "",
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching employee:", error);
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id, supabase]);

  // Handle form input changes
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Parse address string to extract street, city, province, postal code
  const parseAddressString = (address: string) => {
    try {
      const parts = address.split(", ").map((part) => part.trim());
      if (parts.length >= 2) {
        const streetPart = parts[0] || "";
        const cityPart = parts[1] || "";
        const postalCodePart = parts[2] || "";

        return {
          street: streetPart,
          city: cityPart,
          province: "Alberta",
          postalCode: postalCodePart,
          country: "Canada",
        };
      }
    } catch (error) {
      console.error("Error parsing address:", error);
    }
    // Return defaults if parsing fails
    return {
      street: address,
      city: "",
      province: "Alberta",
      postalCode: "",
      country: "Canada",
    };
  };

  const handleAddressChange = (
    address: string,
    coordinates?: { latitude: number; longitude: number }
  ) => {
    const addressData = parseAddressString(address);

    setFormData((prev) => ({
      ...prev,
      address: address,
      ...addressData,
      latitude: coordinates?.latitude?.toString() || prev.latitude,
      longitude: coordinates?.longitude?.toString() || prev.longitude,
    }));
  };

  const handleDaySelection = (day: string) => {
    const isDaySelected = formAvailability.some(
      (availability) => availability.day_of_week === day
    );

    if (isDaySelected) {
      // Remove day if already selected by setting empty times
      handleAvailabilityChange(day, "", "");
    } else {
      // Add day if not already selected
      const originalAvailability = employeeAvailability?.find(
        (availability) => availability.day_of_week === day
      );
      // Use original times if they exist, otherwise use defaults
      handleAvailabilityChange(
        day,
        originalAvailability?.start_time || "00:00",
        originalAvailability?.end_time || "23:59:59"
      );
    }
  };

  // Handler for address errors from AddressForm
  const handleAddressError = (errors: ValidationError[]) => {
    setValidationErrors(errors);
    setShowErrorModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationRules: ValidationRule[] = [
      createValidationRule(
        "first_name",
        true,
        undefined,
        "First name is required.",
        firstNameRef.current
      ),
      createValidationRule(
        "last_name",
        true,
        undefined,
        "Last name is required.",
        lastNameRef.current
      ),
      createValidationRule(
        "role",
        true,
        undefined,
        "Role is required.",
        roleRef.current
      ),
      createValidationRule(
        "email",
        true,
        (value: unknown) => typeof value === "string" && validateEmail(value),
        "Please enter a valid email address.",
        emailRef.current
      ),
      createValidationRule(
        "phone",
        true,
        (value: unknown) => typeof value === "string" && validatePhone(value),
        "Please enter a valid phone number.",
        phoneRef.current
      ),
      createValidationRule(
        "wage",
        true,
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 0),
        "Wage is required and must be a positive number.",
        wageRef.current
      ),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    // If setting inactive, check for future assignments and warn
    if (formData.isAvailable === false) {
      // Get all assignments and truck assignments for this employee
      const allAssignments = await assignmentsApi.getAssignmentsByEmployeeId(
        id as string
      );
      const allTruckAssignments =
        await assignmentsApi.getTruckAssignmentsByEmployeeId(id as string);
      const now = new Date();
      // Filter for assignments/events in the future (end_date >= today)
      const future = allAssignments.filter(
        (a) => new Date(a.start_date) >= now
      );
      const futureTrucks = allTruckAssignments.filter(
        (a) => new Date(a.start_time) >= now
      );
      if (future.length > 0 || futureTrucks.length > 0) {
        setFutureAssignments(future);
        setFutureTruckAssignments(futureTrucks);
        setShowAssignmentWarning(true);
        setPendingInactiveUpdate(() => async () => {
          // Remove all assignments
          for (const a of future) {
            await assignmentsApi.removeServerAssignment(a.id, a.event_id);
          }
          // Remove all truck assignments
          for (const t of futureTrucks) {
            await assignmentsApi.removeTruckAssignment(t.id);
          }
          // Continue with the rest of the save
          await doSaveEmployee();
        });
        return;
      }
    }

    try {
      // Use structured address data from formData
      const street = formData.street || "";
      const city = formData.city || "";
      const province = formData.province || "";
      const postalCode = formData.postalCode || "";
      const country = formData.country || "Canada";

      // Update or create address
      let addressId: string | null = null;

      // Check if employee has existing address

      const { data: existingEmployee, error: existingEmployeeError } =
        await supabase
          .from("employees")
          .select(
            `
            address_id,
            addresses (
              street,
              city,
              province,
              postal_code,
              country,
              latitude,
              longitude
            )
          `
          )
          .eq("employee_id", id)
          .single();

      if (existingEmployeeError) {
        console.error(
          "Error fetching existing employee:",
          existingEmployeeError
        );
      }

      if (existingEmployee?.address_id) {
        // Update existing address
        const { error: addressError } = await addressesApi.updateAddress(
          existingEmployee.address_id,
          {
            street,
            city,
            province,
            postal_code: postalCode,
            country,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
          }
        );

        if (addressError) {
          setValidationErrors([
            {
              field: "address",
              message: "Failed to update address. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          return;
        }
        addressId = existingEmployee.address_id;
      } else {
        // Create new address
        const { data: newAddress, error: addressError } = await supabase
          .from("addresses")
          .insert({
            street,
            city,
            province,
            postal_code: postalCode,
            country,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude
              ? parseFloat(formData.longitude)
              : null,
          })
          .select()
          .single();

        if (addressError) {
          setValidationErrors([
            {
              field: "address",
              message: "Failed to create address. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          return;
        }
        addressId = newAddress.id;
      }

      // Update employee with address_id
      const updateData: {
        first_name: string;
        last_name: string;
        employee_type: string;
        address_id: string | null;
        user_phone?: string;
        is_available: boolean;
        availability: string[];
        user_email?: string;
      } = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        employee_type: formData.role,
        address_id: addressId, // Always update address_id
        is_available: formData.isAvailable,
        availability: formAvailability.map((av) => av.day_of_week),
      };

      // Only update email and phone if they're different from the current ones

      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("user_email, user_phone")
        .eq("employee_id", id)
        .single();

      if (formData.email !== currentEmployee?.user_email) {
        if (currentEmployee?.user_email === null) {
          updateData.user_email = formData.email;
        } else {
          const currentEmailExists = await employeesApi.checkIfEmailExists(
            formData.email,
            id as string
          );
          if (currentEmailExists) {
            setValidationErrors([
              {
                field: "email",
                message:
                  "This email is already in use by another employee. Please use a different email.",
                element: emailRef.current,
              },
            ]);
            setShowErrorModal(true);
            return;
          } else {
            updateData.user_email = formData.email;
          }
        }
      }

      // Check if the new phone number is already used by another employee
      if (formData.phone !== currentEmployee?.user_phone) {
        // If current phone is null, we can always update
        if (currentEmployee?.user_phone === null) {
          updateData.user_phone = formData.phone;
        } else {
          // Check if the new phone number is already used by another employee
          const currentPhoneExists = await employeesApi.checkIfPhoneExists(
            formData.phone,
            id as string
          );

          if (currentPhoneExists) {
            setValidationErrors([
              {
                field: "phone",
                message:
                  "This phone number is already in use by another employee. Please use a different phone number.",
                element: phoneRef.current,
              },
            ]);
            setShowErrorModal(true);
            return;
          } else {
            updateData.user_phone = formData.phone;
          }
        }
      } else {
        updateData.user_phone = currentEmployee.user_phone;
      }

      // update employee with employeeApi error handling
      try {
        await employeesApi.updateEmployee(id as string, updateData);
      } catch (error) {
        setValidationErrors([
          // @ts-expect-error TODO (yoohyun.kim): fix error type
          { field: "submit", message: error.message, element: null },
        ]);
        setShowErrorModal(true);
        return;
      }

      // Verify address update by fetching the updated employee data
      const { error: verifyError } = await supabase
        .from("employees")
        .select(
          `
          *,
          addresses (
            street,
            city,
            province,
            postal_code,
            country,
            latitude,
            longitude
          )
        `
        )
        .eq("employee_id", id)
        .single();

      if (verifyError) {
        console.error("Error verifying employee update:", verifyError);
      }

      // Wage update with history
      if (formData.wage) {
        try {
          await wagesApi.updateWage(id as string, parseFloat(formData.wage));
        } catch (wageError) {
          setValidationErrors([
            // @ts-expect-error TODO (yoohyun.kim): fix error type
            { field: "wage", message: wageError.message, element: null },
          ]);
          setShowErrorModal(true);
        }
      }

      // Show success modal instead of alert
      setValidationErrors([
        {
          field: "success",
          message: "Employee updated successfully!",
          element: null,
        },
      ]);
      setShowErrorModal(true);

      // upsert availability
      handleUpsertAvailability();

      // Redirect after closing modal
      setTimeout(() => {
        router.push("/employees");
      }, 1500);
    } catch (error) {
      setValidationErrors([
        {
          field: "submit",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update employee. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      return;
    }
  };

  // The actual save logic, extracted for reuse after assignment removal
  const doSaveEmployee = async () => {
    try {
      // Use structured address data from formData
      const street = formData.street || "";
      const city = formData.city || "";
      const province = formData.province || "";
      const postalCode = formData.postalCode || "";
      const country = formData.country || "Canada";

      // Update or create address
      let addressId: string | null = null;

      // Check if employee has existing address

      const { data: existingEmployee, error: existingEmployeeError } =
        await supabase
          .from("employees")
          .select(
            `
            address_id,
            addresses (
              street,
              city,
              province,
              postal_code,
              country,
              latitude,
              longitude
            )
          `
          )
          .eq("employee_id", id)
          .single();

      if (existingEmployeeError) {
        console.error(
          "Error fetching existing employee:",
          existingEmployeeError
        );
      }

      if (existingEmployee?.address_id) {
        // Update existing address
        const { error: addressError } = await addressesApi.updateAddress(
          existingEmployee.address_id,
          {
            street,
            city,
            province,
            postal_code: postalCode,
            country,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
          }
        );

        if (addressError) {
          setValidationErrors([
            {
              field: "address",
              message: "Failed to update address. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          return;
        }
        addressId = existingEmployee.address_id;
      } else {
        // Create new address
        const { data: newAddress, error: addressError } = await supabase
          .from("addresses")
          .insert({
            street,
            city,
            province,
            postal_code: postalCode,
            country,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude
              ? parseFloat(formData.longitude)
              : null,
          })
          .select()
          .single();

        if (addressError) {
          setValidationErrors([
            {
              field: "address",
              message: "Failed to create address. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          return;
        }
        addressId = newAddress.id;
      }

      // Update employee with address_id
      const updateData: {
        first_name: string;
        last_name: string;
        employee_type: string;
        address_id: string | null;
        user_phone?: string;
        is_available: boolean;
        availability: string[];
        user_email?: string;
      } = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        employee_type: formData.role,
        address_id: addressId, // Always update address_id
        is_available: formData.isAvailable,
        availability: formAvailability.map((av) => av.day_of_week),
      };

      // Only update email and phone if they're different from the current ones

      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("user_email, user_phone")
        .eq("employee_id", id)
        .single();

      if (formData.email !== currentEmployee?.user_email) {
        if (currentEmployee?.user_email === null) {
          updateData.user_email = formData.email;
        } else {
          const currentEmailExists = await employeesApi.checkIfEmailExists(
            formData.email,
            id as string
          );
          if (currentEmailExists) {
            setValidationErrors([
              {
                field: "email",
                message:
                  "This email is already in use by another employee. Please use a different email.",
                element: emailRef.current,
              },
            ]);
            setShowErrorModal(true);
            return;
          } else {
            updateData.user_email = formData.email;
          }
        }
      }

      // Check if the new phone number is already used by another employee
      if (formData.phone !== currentEmployee?.user_phone) {
        // If current phone is null, we can always update
        if (currentEmployee?.user_phone === null) {
          updateData.user_phone = formData.phone;
        } else {
          // Check if the new phone number is already used by another employee
          const currentPhoneExists = await employeesApi.checkIfPhoneExists(
            formData.phone,
            id as string
          );

          if (currentPhoneExists) {
            setValidationErrors([
              {
                field: "phone",
                message:
                  "This phone number is already in use by another employee. Please use a different phone number.",
                element: phoneRef.current,
              },
            ]);
            setShowErrorModal(true);
            return;
          } else {
            updateData.user_phone = formData.phone;
          }
        }
      } else {
        updateData.user_phone = currentEmployee.user_phone;
      }

      // update employee with employeeApi error handling
      try {
        await employeesApi.updateEmployee(id as string, updateData);
      } catch (error) {
        setValidationErrors([
          // @ts-expect-error TODO (yoohyun.kim): fix error type
          { field: "submit", message: error.message, element: null },
        ]);
        setShowErrorModal(true);
        return;
      }

      // Verify address update by fetching the updated employee data
      const { error: verifyError } = await supabase
        .from("employees")
        .select(
          `
          *,
          addresses (
            street,
            city,
            province,
            postal_code,
            country,
            latitude,
            longitude
          )
        `
        )
        .eq("employee_id", id)
        .single();

      if (verifyError) {
        console.error("Error verifying employee update:", verifyError);
      }

      // Wage update with history
      if (formData.wage) {
        try {
          await wagesApi.updateWage(id as string, parseFloat(formData.wage));
        } catch (wageError) {
          setValidationErrors([
            // @ts-expect-error TODO (yoohyun.kim): fix error type
            { field: "wage", message: wageError.message, element: null },
          ]);
          setShowErrorModal(true);
        }
      }

      // Show success modal instead of alert
      setValidationErrors([
        {
          field: "success",
          message: "Employee updated successfully!",
          element: null,
        },
      ]);
      setShowErrorModal(true);

      // upsert availability
      handleUpsertAvailability();

      // Redirect after closing modal
      setTimeout(() => {
        router.push("/employees");
      }, 1500);
    } catch (error) {
      setValidationErrors([
        {
          field: "submit",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update employee. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      return;
    }
  };

  const handleDelete = async () => {
    try {
      // Delete employee
      const { error: employeeError } = await supabase
        .from("employees")
        .delete()
        .eq("employee_id", id);

      if (employeeError) {
        setValidationErrors([
          { field: "delete", message: employeeError.message, element: null },
        ]);
        setShowErrorModal(true);
        return;
      }

      // Show success modal and redirect
      setValidationErrors([
        {
          field: "success",
          message: "Employee deleted successfully!",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setTimeout(() => {
        router.push("/employees");
      }, 1500);
    } catch (error) {
      setValidationErrors([
        {
          field: "delete",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete employee. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading employee details...</p>
      </div>
    );
  }

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".edit-employee-page")}
      className="edit-employee-page"
    >
      <div className="flex justify-between items-center mb-4">
        <button className="button" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Employee</h1>
      <TutorialHighlight isHighlighted={shouldHighlight("form")}>
        <form
          key={`${id}-${formData.role}`}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Name */}
          <div>
            <label htmlFor="first_name" className="block font-medium">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstNameRef}
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="input-field"
            />
            <label htmlFor="last_name" className="block font-medium">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={lastNameRef}
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium">
              Address <span className="text-red-500">*</span>
            </label>
            <AddressForm
              ref={addressFormRef}
              value={formData.address}
              onChange={handleAddressChange}
              className="input-field"
              onAddressError={handleAddressError}
            />
          </div>

          {/* Role */}
          {isAdmin && (
            <div>
              <label htmlFor="role" className="block font-medium">
                Role <span className="text-red-500">*</span>
                {!isAdmin && (
                  <span className="text-yellow-600 ml-2">(Admin Only)</span>
                )}
              </label>
              {isAdmin ? (
                <select
                  ref={roleRef}
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select Role</option>
                  <option value="Driver">Driver</option>
                  <option value="Server">Server</option>
                  <option value="Admin">Admin</option>
                </select>
              ) : (
                <div className="input-field bg-gray-100 text-gray-700 cursor-not-allowed" style={{padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}>
                  {formData.role || 'N/A'}
                </div>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block font-medium">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              ref={phoneRef}
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Wage */}
          <div>
            <label htmlFor="wage" className="block font-medium">
              Wage <span className="text-red-500">*</span>
              {!isAdmin && (
                <span className="text-yellow-600 ml-2">(Admin Only)</span>
              )}
            </label>
            {isAdmin ? (
              <input
                ref={wageRef}
                type="number"
                id="wage"
                name="wage"
                value={formData.wage}
                onChange={handleChange}
                className="input-field"
                min="0"
                step="0.01"
              />
            ) : (
              <div className="input-field bg-gray-100 text-gray-700 cursor-not-allowed" style={{padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}>
                {formData.wage || 'N/A'}
              </div>
            )}
          </div>

          {/* Is Available */}
          {isAdmin && (
            <>
              <div className="mt-8 mb-8">
                <h3 className="font-bold text-base mb-1">Active Employee</h3>
                <TutorialHighlight
                  isHighlighted={shouldHighlight(".active-employee-explanation")}
                  className="active-employee-explanation"
                >
                  <div className="text-sm text-gray-700">
                    Set employees as inactive if they are no longer working
                    actively. This allows you to retain employee records without
                    deleting them.
                  </div>
                </TutorialHighlight>
              </div>
              <div>
                <label htmlFor="isAvailable" className="flex gap-2 font-bold">
                  <span className="w-4 h-4">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      disabled={!isAdmin}
                      className={!isAdmin ? 'cursor-not-allowed' : ''}
                    />
                  </span>
                  <span>Is Available</span>
                </label>
              </div>
            </>
          )}

          {/* Availability */}
          <div>
            <h2 className="font-bold text-xl">
              Availability (Days of the Week)
            </h2>
            <TutorialHighlight
              isHighlighted={shouldHighlight(".availability-options")}
              className="availability-options"
            >
              <label className="flex gap-2 font-bold" htmlFor="select-all">
                {/* if deselect clear availability */}
                <span className="w-4 h-4">
                  <input
                    id="select-all"
                    type="checkbox"
                    checked={formAvailability.length === daysOfWeek.length}
                    onChange={() => {
                      if (formAvailability.length === daysOfWeek.length) {
                        clearAvailability();
                      } else {
                        selectAllAvailability();
                      }
                    }}
                    // check if  are selected and if so, show deselect all and when click deselet all it should clear availability
                  />
                </span>
                <span className="ml-2">
                  {formAvailability.length === daysOfWeek.length
                    ? "Deselect All"
                    : "Select All"}
                </span>
              </label>
              {daysOfWeek.map((day) => (
                <AvailabilityInput
                  key={day}
                  day={day}
                  isChecked={formAvailability.some(
                    (availability) => availability.day_of_week === day
                  )}
                  handleDaySelection={handleDaySelection}
                  handleAvailabilityChange={handleAvailabilityChange}
                  startTime={
                    formAvailability.find(
                      (availability) => availability.day_of_week === day
                    )?.start_time || "00:00"
                  }
                  endTime={
                    formAvailability.find(
                      (availability) => availability.day_of_week === day
                    )?.end_time || "23:59"
                  }
                />
              ))}
            </TutorialHighlight>
          </div>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", gap: "2rem", marginLeft: "1rem" }}>
              <TutorialHighlight
                isHighlighted={shouldHighlight("form button[type='submit']")}
              >
                <button type="submit" className="button">
                  Save Changes
                </button>
              </TutorialHighlight>
              <TutorialHighlight
                isHighlighted={shouldHighlight(
                  "button[onClick*='setShowDeleteModal']"
                )}
              >
                <button
                  type="button"
                  className="button bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Employee
                </button>
              </TutorialHighlight>
            </div>
          </div>
        </form>
      </TutorialHighlight>

      {/* Error/Success Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
        type={
          validationErrors.length === 1 &&
          validationErrors[0].field === "success"
            ? "success"
            : "error"
        }
        title={
          validationErrors.length === 1 &&
          validationErrors[0].field === "success"
            ? "Success!"
            : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              border: "4px solid var(--error-medium)",
              fontFamily: "sans-serif",
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              ⚠️
            </span>
            <p
              style={{
                color: "var(--error-dark)",
                fontWeight: 800,
                fontSize: "1.25rem",
                marginBottom: "1rem",
                textAlign: "center",
                letterSpacing: "0.03em",
              }}
            >
              Confirm Delete
            </p>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1.5rem",
                color: "var(--text-secondary)",
                fontSize: "1rem",
              }}
            >
              Are you sure you want to delete {formData.first_name}{" "}
              {formData.last_name}? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "var(--border)",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s",
                }}
                onClick={() => setShowDeleteModal(false)}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--text-muted)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "var(--border)")
                }
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "var(--error-medium)",
                  color: "var(--white)",
                  fontWeight: 700,
                  borderRadius: "0.5rem",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.15)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "background 0.2s",
                }}
                onClick={handleDelete}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--error-dark)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "var(--error-medium)")
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment warning modal */}
      {showAssignmentWarning && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Warning: Remove Assignments</h2>
            </div>
            <div
              className="modal-body"
              style={{
                maxWidth: "100vw",
                overflowX: "auto",
                padding: "0.5rem",
              }}
            >
              <p className="mb-2">
                This employee is currently assigned to the following future
                events and/or truck assignments. Setting them as inactive will
                remove these assignments and mark the events as pending if not
                fully staffed.
              </p>
              {futureAssignments.length > 0 && (
                <>
                  <h3 className="font-semibold mt-2 mb-1">Event Assignments</h3>
                  <div className="flex flex-col gap-2 mb-2">
                    {futureAssignments.map((a) => (
                      <div
                        key={a.id}
                        className="event-card bg-white px-3 py-2 rounded shadow-sm border border-gray-200 flex flex-row flex-wrap items-center gap-2 cursor-pointer hover:bg-primary-light/40 transition min-w-0"
                        onClick={() => router.push(`/events/${a.event_id}`)}
                        title="View Event Details"
                        style={{ wordBreak: "break-word", overflow: "hidden" }}
                      >
                        <span
                          className="font-semibold text-sm truncate min-w-0 flex-1"
                          style={{ maxWidth: "70%" }}
                        >
                          {a.events?.title || "(Untitled Event)"}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(a.start_date), "yyyy-MM-dd")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {futureTruckAssignments.length > 0 && (
                <>
                  <h3 className="font-semibold mt-2 mb-1">Truck Assignments</h3>
                  <ul className="list-disc pl-5 mb-2">
                    {futureTruckAssignments.map((t) => (
                      <li key={t.id}>
                        Event ID: {t.event_id} —{" "}
                        {format(new Date(t.start_time), "yyyy-MM-dd HH:mm")} to{" "}
                        {format(new Date(t.end_time), "yyyy-MM-dd HH:mm")}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="modal-footer flex gap-4 justify-end">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAssignmentWarning(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  setShowAssignmentWarning(false);
                  if (pendingInactiveUpdate) await pendingInactiveUpdate();
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </TutorialHighlight>
  );
}

// TODO (yoohyun.kim): refactor to components
const AvailabilityInput = ({
  day,
  isChecked,
  handleDaySelection,
  handleAvailabilityChange,
  startTime,
  endTime,
}: {
  day: string;
  isChecked: boolean;
  handleDaySelection: (day: string) => void;
  handleAvailabilityChange: (
    dayOfWeek: string,
    startTime: string,
    endTime: string
  ) => void;
  startTime: string;
  endTime: string;
}) => {
  return (
    <div>
      <label className="flex gap-2 font-bold" htmlFor={day}>
        <span className="w-4 h-4">
          <input
            id={day}
            type="checkbox"
            checked={isChecked}
            onChange={() => handleDaySelection(day)}
          />
        </span>
        <span>{day}</span>
      </label>
      {isChecked ? (
        <div className="flex gap-2">
          <label htmlFor={`${day}-start-time`}>
            Start Time
            <input
              id={`${day}-start-time`}
              type="time"
              value={startTime || "00:00"}
              onChange={(e) =>
                handleAvailabilityChange(
                  day,
                  e.target.value,
                  endTime || "23:59:59"
                )
              }
            />
          </label>
          <label htmlFor={`${day}-end-time`}>
            End Time
            <input
              id={`${day}-end-time`}
              type="time"
              value={endTime || "23:59:59"}
              onChange={(e) =>
                handleAvailabilityChange(
                  day,
                  startTime || "00:00",
                  e.target.value
                )
              }
            />
          </label>
        </div>
      ) : null}
    </div>
  );
};

// TODO (yoohyun.kim): refactor to hooks
const useAvailability = (id: string) => {
  const [formAvailability, setFormAvailability] = useState<
    EmployeeAvailability[]
  >([]);

  const { data: employeeAvailability } = useQuery({
    queryKey: ["employee-availability", id],
    queryFn: () =>
      employeeAvailabilityApi.getEmployeeAvailability(id as string),
  });

  const { mutate: upsertEmployeeAvailability } = useMutation({
    mutationFn: (availability: EmployeeAvailability) =>
      employeeAvailabilityApi.upsertEmployeeAvailability(id, availability),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-availability", id],
      });
    },
  });

  const { mutate: deleteAvailability } = useMutation({
    mutationFn: (availabilityId: string) =>
      employeeAvailabilityApi.deleteEmployeeAvailability(availabilityId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-availability", id],
      });
    },
  });

  useEffect(() => {
    if (employeeAvailability) {
      setFormAvailability(employeeAvailability);
    }
  }, [employeeAvailability]);

  const clearAvailability = () => {
    setFormAvailability([]);
  };

  const removeDay = (day: string) => {
    setFormAvailability((prev) =>
      prev.filter((availability) => availability.day_of_week !== day)
    );
  };

  const selectAllAvailability = () => {
    const allDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const newAvailability = allDays.map((day) => ({
      day_of_week: day,
      start_time: "00:00",
      end_time: "23:59:59",
      employee_id: id,
      created_at: new Date().toISOString(),
      id: crypto.randomUUID(),
    }));

    setFormAvailability(newAvailability);
  };

  const handleAvailabilityChange = (
    dayOfWeek: string,
    startTime: string,
    endTime: string
  ) => {
    const newAvailability = [...formAvailability];
    const currentDayIdx = newAvailability.findIndex(
      (availability) => availability.day_of_week === dayOfWeek
    );

    // If both times are empty, remove the day entirely
    if (startTime === "" && endTime === "") {
      if (currentDayIdx !== -1) {
        newAvailability.splice(currentDayIdx, 1);
      }
    } else if (currentDayIdx === -1) {
      // Add new day
      newAvailability.push({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        employee_id: id,
        created_at: new Date().toISOString(),
        id: crypto.randomUUID(),
      });
    } else {
      // Update existing day
      newAvailability[currentDayIdx] = {
        ...newAvailability[currentDayIdx],
        start_time: startTime,
        end_time: endTime,
      };
    }
    setFormAvailability(newAvailability);
  };

  const handleUpsertAvailability = () => {
    // If formAvailability is empty, delete all existing availability
    if (formAvailability.length === 0) {
      employeeAvailability?.forEach((availability) => {
        deleteAvailability(availability.id);
      });
      return;
    }

    formAvailability.forEach((availability) => {
      const originalDayAvailability = employeeAvailability?.find(
        (a) => a.day_of_week === availability.day_of_week
      );

      // If the day is selected in formData.availability but has empty times,
      // use default times (00:00 - 23:59)
      let startTime = availability.start_time;
      let endTime = availability.end_time;

      if (startTime === "" || endTime === "") {
        startTime = "00:00";
        endTime = "23:59:59";
      }

      // If there was an original availability but now we have empty times,
      // delete the original entry
      if (
        Boolean(originalDayAvailability) &&
        availability.start_time === "" &&
        availability.end_time === ""
      ) {
        deleteAvailability(originalDayAvailability?.id || "");
        return;
      }

      // Skip if both times are empty (day is not selected)
      if (availability.start_time === "" && availability.end_time === "") {
        return;
      }

      if (startTime >= endTime) {
        throw new Error("Start time must be before end time");
      }

      // Create availability object with potentially default times
      const availabilityToUpsert = {
        ...availability,
        start_time: startTime,
        end_time: endTime,
      };

      upsertEmployeeAvailability(availabilityToUpsert);
    });
  };

  return {
    employeeAvailability,
    formAvailability,
    handleAvailabilityChange,
    handleUpsertAvailability,
    clearAvailability,
    selectAllAvailability,
    removeDay,
  };
};
