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
import { wagesApi } from "@/lib/supabase/wages";

export default function EditEmployeePage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

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

        // Get wage data
        const { data: wageData } = await supabase
          .from("wage")
          .select("*")
          .eq("employee_id", id)
          .single();

        // Format address
        const address = employeeData.addresses
          ? `${employeeData.addresses.street}, ${employeeData.addresses.city}, ${employeeData.addresses.province}`
          : "";

        console.log("Employee data:", employeeData);
        console.log("Address data:", employeeData.addresses);
        console.log("Formatted address:", address);

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

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submission started");

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
        console.log(
          "Updating existing address with ID:",
          existingEmployee.address_id
        );
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
          console.error("Error updating address:", addressError);
          alert("Failed to update address.");
          return;
        }
        addressId = existingEmployee.address_id;
        console.log("Address updated successfully");
      } else {
        // Create new address
        console.log("Creating new address...");
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
          console.error("Error creating address:", addressError);
          alert("Failed to create address.");
          return;
        }
        addressId = newAddress.id;
        console.log("Created new address with ID:", addressId);
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

      console.log("Update data with address_id:", updateData);

      // Only update email and phone if they're different from the current ones
      console.log("Checking email and phone updates...");
      const { data: currentEmployee } = await supabase
        .from("employees")
        .select("user_email, user_phone")
        .eq("employee_id", id)
        .single();

      if (formData.email !== currentEmployee?.user_email) {
        updateData.user_email = formData.email;
        console.log("Email will be updated");
      }

      // Check if the new phone number is already used by another employee
      if (formData.phone !== currentEmployee?.user_phone) {
        // If current phone is null, we can always update
        if (currentEmployee?.user_phone === null) {
          updateData.user_phone = formData.phone;
          console.log("Phone will be updated (was null)");
        } else {
          // Check if the new phone number is already used by another employee
          console.log("Checking if phone number is already used...");
          const { data: existingEmployeeWithPhone } = await supabase
            .from("employees")
            .select("employee_id")
            .eq("user_phone", formData.phone)
            .neq("employee_id", id)
            .single();

          if (existingEmployeeWithPhone) {
            console.error("Phone number already used by another employee");
            alert(
              "This phone number is already used by another employee. Please use a different phone number."
            );
            return;
          } else {
            updateData.user_phone = formData.phone;
            console.log("Phone will be updated");
          }
        }
      } else {
        updateData.user_phone = currentEmployee.user_phone;
        console.log("Phone unchanged");
      }

      console.log("Final update data:", updateData);
      console.log("Employee ID:", id);
      console.log("Current email:", currentEmployee?.user_email);
      console.log("New email:", formData.email);
      console.log("Current phone:", currentEmployee?.user_phone);
      console.log("New phone:", formData.phone);

      console.log("Updating employee in database...");
      const { data: updatedEmployee, error: employeeError } = await supabase
        .from("employees")
        .update(updateData)
        .eq("employee_id", id)
        .select()
        .single();

      if (employeeError) {
        console.error("Error updating employee:", employeeError);
        console.error("Error details:", employeeError.details);
        console.error("Error hint:", employeeError.hint);
        console.error("Error message:", employeeError.message);
        alert("Failed to update employee.");
        return;
      }

      console.log("Employee updated successfully:", updatedEmployee);

      // Verify address update by fetching the updated employee data
      console.log("Verifying address update...");
      const { data: verifyEmployee, error: verifyError } = await supabase
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
      } else {
        console.log("Verified employee data:", verifyEmployee);
        console.log("Address ID after update:", verifyEmployee.address_id);
        console.log("Address data after update:", verifyEmployee.addresses);
      }

      // Update wage
      if (formData.wage) {
        try {
          const newWageValue = parseFloat(formData.wage);
          const existingWage = await wagesApi.getCurrentWage(id as string);

          // Only update or create if the wage has actually changed
          if (!existingWage || existingWage.hourly_wage !== newWageValue) {
            if (existingWage) {
              // Update existing wage
              console.log(
                "Wage changed. Updating existing wage with ID:",
                existingWage.id
              );
              await wagesApi.updateWage(existingWage.id, {
                hourly_wage: newWageValue,
              });
            } else {
              // Create new wage
              console.log("No existing wage. Creating new wage.");
              const wageData = {
                employee_id: id as string,
                hourly_wage: newWageValue,
                start_date: new Date().toISOString(),
                end_date: null,
              };
              await wagesApi.createWage(wageData);
            }
          } else {
            console.log("Wage is unchanged. Skipping wage update.");
          }
        } catch (wageError) {
          console.error("Error updating wage:", wageError);
          // Don't stop the process for wage errors
        }
      }

      alert("Employee updated successfully!");
      router.push("/employees");
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("An error occurred while updating the employee.");
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
        console.error("Error deleting employee:", employeeError);
        alert("Failed to delete employee.");
        return;
      }

      // Navigate back to employees list
      router.push("/employees");
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("Failed to delete employee. Please try again.");
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
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="input-field"
              required
            />
            <label htmlFor="last_name" className="block font-medium">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium">Address</label>
            <AddressForm
              ref={addressFormRef}
              value={formData.address}
              onChange={handleAddressChange}
              required
              className="input-field"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block font-medium">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input-field"
              required
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
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block font-medium">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          {/* Wage */}
          <div>
            <label htmlFor="wage" className="block font-medium">
              Wage
            </label>
            <input
              type="number"
              id="wage"
              name="wage"
              value={formData.wage}
              onChange={handleChange}
              className="input-field"
              required
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
