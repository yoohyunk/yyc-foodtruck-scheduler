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
import { EmployeeFormData } from "@/app/types";
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

export default function EditEmployeePage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { shouldHighlight } = useTutorial();
  const addressFormRef = useRef<AddressFormRef>(null);
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
    } else {
      // Add day if not already selected
      setFormData({
        ...formData,
        availability: [...formData.availability, day],
      });
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
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
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
          .eq("id", existingEmployee.address_id);

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
        updateData.user_email = formData.email;
      }

      // Check if the new phone number is already used by another employee
      if (formData.phone !== currentEmployee?.user_phone) {
        // If current phone is null, we can always update
        if (currentEmployee?.user_phone === null) {
          updateData.user_phone = formData.phone;
        } else {
          // Check if the new phone number is already used by another employee
          const { data: existingEmployeeWithPhone } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("user_phone", formData.phone)
            .neq("employee_id", id)
            .single();

          if (existingEmployeeWithPhone) {
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

      console.log("Final update data:", updateData);
      console.log("Employee ID:", id);
      console.log("Current email:", currentEmployee?.user_email);
      console.log("New email:", formData.email);
      console.log("Current phone:", currentEmployee?.user_phone);
      console.log("New phone:", formData.phone);

      console.log("Updating employee in database...");
      const { error: employeeError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("employee_id", id)
        .select()
        .single();

      if (employeeError) {
        console.error("Error updating employee:", employeeError);
        setValidationErrors([
          {
            field: "submit",
            message:
              employeeError instanceof Error
                ? employeeError.message
                : "Failed to update employee. Please try again.",
            element: null,
          },
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
          const newWageValue = parseFloat(formData.wage);
          const { data: wageRows, error: wageFetchError } = await supabase
            .from("wage")
            .select("*")
            .eq("employee_id", id)
            .order("start_date", { ascending: false });

          if (wageFetchError) {
            setValidationErrors([
              { field: "wage", message: wageFetchError.message, element: null },
            ]);
            setShowErrorModal(true);
          } else {
            const currentWage =
              wageRows && wageRows.length > 0 ? wageRows[0] : null;
            if (!currentWage || currentWage.hourly_wage !== newWageValue) {
              if (currentWage) {
                await supabase
                  .from("wage")
                  .update({ end_date: new Date().toISOString() })
                  .eq("id", currentWage.id);
              }
              const wageData = {
                employee_id: id as string,
                hourly_wage: newWageValue,
                start_date: new Date().toISOString(),
                end_date: null,
              };
              await supabase.from("wage").insert(wageData);
            }
          }
        } catch (wageError) {
          setValidationErrors([
            {
              field: "wage",
              message:
                wageError instanceof Error
                  ? wageError.message
                  : "Error updating wage.",
              element: null,
            },
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
            <label htmlFor="isAvailable" className="block font-medium">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
              />
              Is Available
            </label>
          </div>

          {/* Availability */}
          <div>
            <label className="block font-medium">
              Availability (Days of the Week)
            </label>
            <TutorialHighlight
              isHighlighted={shouldHighlight(".availability-options")}
              className="availability-options"
            >
              <label className="availability-label">
                <input
                  type="checkbox"
                  checked={formData.availability.length === daysOfWeek.length}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
              {daysOfWeek.map((day) => (
                <label key={day} className="availability-label">
                  <input
                    type="checkbox"
                    checked={formData.availability.includes(day)}
                    onChange={() => handleDaySelection(day)}
                  />
                  {day}
                </label>
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
    </TutorialHighlight>
  );
}
