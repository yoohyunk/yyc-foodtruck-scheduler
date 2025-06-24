"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  ReactElement,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "../../database.types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import ErrorModal from "@/app/components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  createValidationRule,
  commonValidationRules,
} from "../../lib/formValidation";

// Use Supabase types
type EmployeeInfo = Tables<"employees"> & { wage?: string };
type AddressInfo = Tables<"addresses">;

export default function SetUpEmployeeInfoPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();
  const addressFormRef = useRef<AddressFormRef>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  const [employee, setEmployee] = useState<EmployeeInfo>({
    employee_id: "",
    user_id: null,
    first_name: null,
    last_name: null,
    employee_type: null,
    address_id: null,
    availability: [],
    is_available: true,
    is_pending: true,
    user_phone: null,
    user_email: null,
    created_at: new Date().toISOString(),
    wage: "",
  });

  const [address, setAddress] = useState<AddressInfo>({
    id: "",
    street: null,
    city: null,
    province: null,
    postal_code: null,
    country: null,
    latitude: null,
    longitude: null,
    created_at: new Date().toISOString(),
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Refs for form fields
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const wageRef = useRef<HTMLInputElement>(null);

  // Add state for address validity and validation message
  const [isAddressValid, setIsAddressValid] = useState<boolean | null>(null);
  const [addressCoords, setAddressCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Auth error:", userError);
          setError("Failed to get user information");
          setLoading(false);
          return;
        }

        if (!user) {
          console.log("No user found");
          setError("Please log in to view your information");
          setLoading(false);
          return;
        }

        console.log("Current user:", user);

        // Get employee data for current user
        console.log("Fetching employee data for user:", user.id);
        const { data: employees, error: employeeError } = await supabase
          .from("employees")
          .select(
            `
            *,
            addresses!left(*)
          `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        console.log("Employee fetch result:", {
          employees,
          error: employeeError,
          hasAddressId: employees?.address_id ? true : false,
        });

        if (employeeError) {
          console.error("Employee fetch error:", employeeError);
          setError(`Failed to fetch employee data: ${employeeError.message}`);
          setLoading(false);
          return;
        }

        if (!employees) {
          console.log("No employee record found for user");
          // Initialize with empty data if no record found
          setEmployee({
            employee_id: "",
            first_name: "",
            last_name: "",
            employee_type: "",
            address_id: null,
            availability: [],
            created_at: "",
            is_available: true,
            user_id: user.id,
            user_phone: null,
            user_email: null,
            is_pending: false,
            wage: "",
          });
          setLoading(false);
          return;
        }

        // Set employee data
        console.log("Setting employee data:", {
          ...employees,
          hasAddressId: employees.address_id ? true : false,
        });

        setEmployee({
          employee_id: employees.employee_id,
          first_name: employees.first_name,
          last_name: employees.last_name,
          employee_type: employees.employee_type,
          address_id: employees.address_id,
          availability: employees.availability || [],
          created_at: employees.created_at,
          is_available: employees.is_available ?? false,
          user_id: employees.user_id,
          user_phone: employees.user_phone,
          user_email: employees.user_email,
          is_pending: employees.is_pending,
          wage: employees.wage || "",
        });

        // Set address data if available
        if (employees.addresses) {
          console.log("Setting address data from join:", employees.addresses);
          setAddress({
            id: employees.addresses.id,
            street: employees.addresses.street || "",
            city: employees.addresses.city || "",
            province: employees.addresses.province || "",
            postal_code: employees.addresses.postal_code || "",
            country: employees.addresses.country || "",
            latitude: employees.addresses.latitude || "",
            longitude: employees.addresses.longitude || "",
            created_at: employees.addresses.created_at,
          });
        } else if (employees.address_id) {
          console.log(
            "Fetching address data separately for address_id:",
            employees.address_id
          );
          const { data: addressData, error: addressError } = await supabase
            .from("addresses")
            .select("*")
            .eq("id", employees.address_id)
            .single();

          console.log("Address fetch result:", {
            addressData,
            error: addressError,
          });

          if (addressError) {
            console.error("Error fetching address:", addressError);
            setAddress({
              id: "",
              street: "",
              city: "",
              province: "",
              postal_code: "",
              country: "",
              latitude: "",
              longitude: "",
              created_at: "",
            });
          } else if (addressData) {
            console.log(
              "Setting address data from separate fetch:",
              addressData
            );
            setAddress({
              id: addressData.id,
              street: addressData.street || "",
              city: addressData.city || "",
              province: addressData.province || "",
              postal_code: addressData.postal_code || "",
              country: addressData.country || "",
              latitude: addressData.latitude || "",
              longitude: addressData.longitude || "",
              created_at: addressData.created_at,
            });
          }
        } else {
          console.log("No address data found");
          setAddress({
            id: "",
            street: "",
            city: "",
            province: "",
            postal_code: "",
            country: "",
            latitude: "",
            longitude: "",
            created_at: "",
          });
        }
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        setError(
          `Failed to fetch data: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase]);

  const handleEmployeeChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };
  const handleDaySelection = (day: string) => {
    setEmployee((prev) => {
      const avail = (prev.availability as string[]) || [];
      return {
        ...prev,
        availability: avail.includes(day)
          ? avail.filter((d: string) => d !== day)
          : [...avail, day],
      };
    });
  };
  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    setEmployee((prev) => ({
      ...prev,
      availability: e.target.checked ? [...daysOfWeek] : [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Sanitize form data
    const sanitizedEmployee = employee;
    const sanitizedAddress = address;

    // Validate form data
    const validationRules: ValidationRule[] = [
      createValidationRule(
        "first_name",
        true,
        (value) => typeof value === "string" && value.trim().length > 0,
        "Please enter a valid first name."
      ),
      createValidationRule(
        "last_name",
        true,
        (value) => typeof value === "string" && value.trim().length > 0,
        "Please enter a valid last name."
      ),
      createValidationRule(
        "user_email",
        true,
        (value) => typeof value === "string" && /^[^@]+@[^@]+\.[^@]+$/.test(value),
        "Please enter a valid email address."
      ),
      createValidationRule(
        "user_phone",
        true,
        (value) => typeof value === "string" && value.trim().length > 0,
        "Please enter a valid phone number."
      ),
    ];

    const validationErrors = validateForm(sanitizedEmployee, validationRules);
    setValidationErrors(validationErrors);

    // Require valid coordinates (Check Address must be clicked and succeed)
    if (
      !addressCoords ||
      addressCoords.latitude === undefined ||
      addressCoords.longitude === undefined ||
      isAddressValid === false
    ) {
      validationErrors.push({
        field: "address",
        message: "Please check address.",
        element: null,
      });
    }

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Error getting user:", userError);
        setError("Failed to get user information");
        return;
      }

      // Check if employee exists
      const { data: existingEmployee, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (employeeError) {
        console.error("Error checking employee:", employeeError);
        setError("Failed to check employee information");
        return;
      }

      if (!existingEmployee) {
        setError("Employee record not found");
        return;
      }

      console.log("Existing employee:", existingEmployee);

      let addressId: string | null = null;

      // Check if employee has an address_id
      if (existingEmployee.address_id) {
        // Update existing address
        console.log("Updating existing address:", existingEmployee.address_id);
        const { data: updatedAddress, error: addressError } = await supabase
          .from("addresses")
          .update({
            street: sanitizedAddress.street || null,
            city: sanitizedAddress.city || null,
            province: sanitizedAddress.province || null,
            postal_code: sanitizedAddress.postal_code || null,
            country: sanitizedAddress.country || null,
            latitude: addressCoords?.latitude || null,
            longitude: addressCoords?.longitude || null,
          })
          .eq("id", existingEmployee.address_id)
          .select()
          .single();

        if (addressError) {
          console.error("Error updating address:", addressError);
          setError(`Failed to update address: ${addressError.message}`);
          return;
        }

        if (!updatedAddress) {
          console.error("No address was updated");
          setError("Failed to update address: No record was updated");
          return;
        }

        addressId = updatedAddress.id;
        console.log("Address updated successfully:", updatedAddress);
      } else {
        // Create new address
        console.log("Creating new address");
        const { data: newAddress, error: addressError } = await supabase
          .from("addresses")
          .insert({
            street: sanitizedAddress.street || null,
            city: sanitizedAddress.city || null,
            province: sanitizedAddress.province || null,
            postal_code: sanitizedAddress.postal_code || null,
            country: sanitizedAddress.country || null,
            latitude: addressCoords?.latitude || null,
            longitude: addressCoords?.longitude || null,
          })
          .select()
          .single();

        if (addressError) {
          console.error("Error creating address:", addressError);
          setError(`Failed to create address: ${addressError.message}`);
          return;
        }

        if (!newAddress) {
          console.error("No address was created");
          setError("Failed to create address: No record was created");
          return;
        }

        addressId = newAddress.id;
        console.log("New address created:", newAddress);
      }

      // Update employee with address_id
      console.log("Updating employee with address_id:", {
        employeeId: existingEmployee.employee_id,
        addressId,
        updateData: {
          first_name: sanitizedEmployee.first_name || null,
          last_name: sanitizedEmployee.last_name || null,
          employee_type: sanitizedEmployee.employee_type || null,
          address_id: addressId,
          availability: employee.availability,
          is_available: employee.is_available,
          user_phone: sanitizedEmployee.user_phone || null,
          user_email: sanitizedEmployee.user_email || null,
          is_pending: employee.is_pending,
        },
      });

      const { data: updatedEmployee, error: employeeUpdateError } =
        await supabase
          .from("employees")
          .update({
            first_name: sanitizedEmployee.first_name || null,
            last_name: sanitizedEmployee.last_name || null,
            employee_type: sanitizedEmployee.employee_type || null,
            address_id: addressId,
            availability: employee.availability,
            is_available: employee.is_available,
            user_phone: sanitizedEmployee.user_phone || null,
            user_email: sanitizedEmployee.user_email || null,
            is_pending: employee.is_pending,
          })
          .eq("employee_id", existingEmployee.employee_id)
          .select();

      console.log("Employee update result:", {
        updatedEmployee,
        error: employeeUpdateError,
        employeeId: existingEmployee.employee_id,
        addressId,
      });

      if (employeeUpdateError) {
        console.error("Error updating employee:", employeeUpdateError);
        const errorMessage =
          employeeUpdateError instanceof Error
            ? employeeUpdateError.message
            : "An unknown error occurred";
        setError(errorMessage);
        return;
      }

      if (!updatedEmployee || updatedEmployee.length === 0) {
        console.error("No employee record was updated");
        setError("Failed to update employee: No record was updated");
        return;
      }

      // Update local state with the new employee data
      setEmployee((prev) => ({
        ...prev,
        address_id: addressId,
      }));

      console.log("Employee updated successfully:", updatedEmployee[0]);

      // Update wage information for non-admin and non-pending employees
      if (
        sanitizedEmployee.employee_type !== "admin" &&
        sanitizedEmployee.employee_type !== "pending"
      ) {
        const { data: existingWage, error: wageError } = await supabase
          .from("wage")
          .select("*")
          .eq("employee_id", existingEmployee.employee_id)
          .single();

        if (wageError && wageError.code !== "PGRST116") {
          console.error("Error checking wage:", wageError);
          setError("Failed to check wage information");
          return;
        }

        if (!existingWage) {
          // Create new wage only if it doesn't exist
          const { error: createWageError } = await supabase
            .from("wage")
            .insert({
              employee_id: existingEmployee.employee_id,
              hourly_wage: 15.0,
              start_date: new Date().toISOString(),
              end_date: null,
              created_at: new Date().toISOString(),
            });

          if (createWageError) {
            console.error("Error creating wage:", createWageError);
            setError("Failed to create wage information");
            return;
          }
        }
      }

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(errorMessage);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (success) return <p className="text-green-600">{success}</p>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 p-4">
            {/* Personal Information Section */}
            <div className="personal-info-section bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstNameRef}
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={employee.first_name || ""}
                    onChange={handleEmployeeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={lastNameRef}
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={employee.last_name || ""}
                    onChange={handleEmployeeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                    {employee.employee_type ? employee.employee_type.charAt(0).toUpperCase() + employee.employee_type.slice(1) : "Not set"}
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Hourly Wage
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                    {employee.wage ? `$${employee.wage}` : "Not set"}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="user_email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="user_email"
                    name="user_email"
                    value={employee.user_email || ""}
                    onChange={handleEmployeeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user_phone"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    id="user_phone"
                    name="user_phone"
                    value={employee.user_phone || ""}
                    onChange={handleEmployeeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="address-form bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                Address Information
              </h2>
              <AddressForm
                ref={addressFormRef}
                value={
                  address.street
                    ? `${address.street}, ${address.city || "Calgary"}, ${address.postal_code || ""}`
                    : ""
                }
                onChange={(addressString, coords) => {
                  // Only update address state on successful Check Address
                  const parts = addressString.split(", ");
                  setAddress({
                    ...address,
                    street: parts[0] || null,
                    city: parts[1] || "Calgary",
                    province: "Alberta",
                    postal_code: parts[2] || null,
                    country: "Canada",
                    latitude: coords?.latitude?.toString() || null,
                    longitude: coords?.longitude?.toString() || null,
                  });
                  setAddressCoords(coords || null);
                  setIsAddressValid(!!coords);
                }}
              />
            </div>

            {/* Availability Section */}
            <div className="availability-options bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Availability</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(employee.availability) &&
                      employee.availability.length === daysOfWeek.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Select All</span>
                </label>
                {daysOfWeek.map((day) => (
                  <label key={day} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(employee.availability) &&
                        employee.availability.includes(day)
                      }
                      onChange={() => handleDaySelection(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className="button"
              >
                Complete Profile
              </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
