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
  } = useAvailability(id);

  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    address: "",
    role: "",
    email: "",
    phone: "",
    wage: "",
    isAvailable: false,
    availability: [] as string[],
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
    console.log("AddressForm onChange called with:", address, coordinates);
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
    if (formData.availability.includes(day)) {
      // Remove day if already selected
      setFormData({
        ...formData,
        availability: formData.availability.filter((d) => d !== day),
      });
      // retain original availability
      handleAvailabilityChange(day, "", "");
    } else {
      // Add day if not already selected
      setFormData({
        ...formData,
        availability: [...formData.availability, day],
      });
      const originalAvailability = employeeAvailability?.find(
        (availability) => availability.day_of_week === day
      );
      handleAvailabilityChange(
        day,
        originalAvailability?.start_time || "",
        originalAvailability?.end_time || ""
      );
    }
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all days
      setFormData({
        ...formData,
        availability: [...daysOfWeek],
      });
    } else {
      // Deselect all days
      setFormData({
        ...formData,
        availability: [],
      });
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
    console.log("Form submission started");

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

    try {
      // Use structured address data from formData
      const street = formData.street || "";
      const city = formData.city || "";
      const province = formData.province || "";
      const postalCode = formData.postalCode || "";
      const country = formData.country || "Canada";

      console.log("FormData address fields:", {
        street: formData.street,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        country: formData.country,
      });

      console.log("Address data to process:", {
        street,
        city,
        province,
        postalCode,
        country,
      });

      // Update or create address
      let addressId: string | null = null;

      // Check if employee has existing address
      console.log("Checking existing employee address...");
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

      console.log("Existing employee data:", existingEmployee);

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

      console.log("Final addressId value:", addressId);

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
        availability: formData.availability,
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label htmlFor="role" className="block font-medium">
              Role <span className="text-red-500">*</span>
              {!isAdmin && (
                <span className="text-yellow-600 ml-2">(Admin Only)</span>
              )}
            </label>
            <select
              ref={roleRef}
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              disabled={!isAdmin}
            >
              <option value="">Select Role</option>
              <option value="Driver">Driver</option>
              <option value="Server">Server</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

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
              disabled={!isAdmin}
            />
          </div>

          {/* Is Available */}
          <div>
            <label htmlFor="isAvailable" className="flex gap-2 font-bold">
              <span className="w-4 h-4">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                />
              </span>
              <span>Is Available</span>
            </label>
          </div>

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
                <span className="w-4 h-4">
                  <input
                    id="select-all"
                    type="checkbox"
                    checked={formData.availability.length === daysOfWeek.length}
                    onChange={handleSelectAll}
                  />
                </span>
                <span className="ml-2">Select All</span>
              </label>
              {daysOfWeek.map((day) => (
                <AvailabilityInput
                  key={day}
                  day={day}
                  isChecked={formData.availability.includes(day)}
                  handleDaySelection={handleDaySelection}
                  handleAvailabilityChange={handleAvailabilityChange}
                  startTime={
                    formAvailability.find(
                      (availability) => availability.day_of_week === day
                    )?.start_time || ""
                  }
                  endTime={
                    formAvailability.find(
                      (availability) => availability.day_of_week === day
                    )?.end_time || ""
                  }
                />
              ))}
            </TutorialHighlight>
          </div>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e5e7eb",
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
              border: "4px solid #ef4444",
              fontFamily: "sans-serif",
            }}
          >
            <span style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              ⚠️
            </span>
            <p
              style={{
                color: "#b91c1c",
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
                color: "#4b5563",
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
                  background: "#e5e7eb",
                  color: "#4b5563",
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
                  (e.currentTarget.style.background = "#d1d5db")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
              >
                Cancel
              </button>
              <button
                style={{
                  padding: "0.5rem 1.5rem",
                  background: "#ef4444",
                  color: "white",
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
                  (e.currentTarget.style.background = "#dc2626")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#ef4444")
                }
              >
                Delete
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
              value={startTime}
              onChange={(e) =>
                handleAvailabilityChange(day, e.target.value, endTime)
              }
            />
          </label>
          <label htmlFor={`${day}-end-time`}>
            End Time
            <input
              id={`${day}-end-time`}
              type="time"
              value={endTime}
              onChange={(e) =>
                handleAvailabilityChange(day, startTime, e.target.value)
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

  const handleAvailabilityChange = (
    dayOfWeek: string,
    startTime: string,
    endTime: string
  ) => {
    const newAvailability = [...formAvailability];
    const currentDayIdx = newAvailability.findIndex(
      (availability) => availability.day_of_week === dayOfWeek
    );
    if (currentDayIdx === -1) {
      newAvailability.push({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        employee_id: id,
        created_at: new Date().toISOString(),
        id: crypto.randomUUID(),
      });
    } else {
      newAvailability[currentDayIdx] = {
        ...newAvailability[currentDayIdx],
        start_time: startTime,
        end_time: endTime,
      };
    }
    setFormAvailability(newAvailability);
  };

  const handleUpsertAvailability = () => {
    formAvailability.forEach((availability) => {
      const originalDayAvailability = employeeAvailability?.find(
        (a) => a.day_of_week === availability.day_of_week
      );

      if (
        Boolean(originalDayAvailability) &&
        (availability.start_time === "" || availability.end_time === "")
      ) {
        deleteAvailability(originalDayAvailability?.id || "");
        return;
      }

      if (availability.start_time === "" || availability.end_time === "") {
        return;
      }

      if (availability.start_time >= availability.end_time) {
        throw new Error("Start time must be before end time");
      }

      upsertEmployeeAvailability(availability);
    });
  };

  return {
    employeeAvailability,
    formAvailability,
    handleAvailabilityChange,
    handleUpsertAvailability,
  };
};
