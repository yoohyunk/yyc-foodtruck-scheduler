"use client";

import React, { useEffect, useState, ChangeEvent, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "../../database.types";

// Use Supabase types

type EmployeeInfo = Tables<"employees">;
type AddressInfo = Tables<"addresses">;

export default function SetUpEmployeeInfoPage(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [employee, setEmployee] = useState<EmployeeInfo>({
    employee_id: "",
    first_name: "",
    last_name: "",
    employee_type: "",
    address_id: null,
    availability: [],
    created_at: "",
    is_available: false,
    user_id: null,
    phone: null,
    email: null,
    is_pending: false,
  });
  const [address, setAddress] = useState<AddressInfo>({
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

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

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
            phone: null,
            email: null,
            is_pending: false,
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
          phone: employees.user_phone,
          email: employees.user_email,
          is_pending: employees.is_pending,
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
  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
            street: address.street,
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
            country: address.country,
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
            street: address.street,
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
            country: address.country,
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
          first_name: employee.first_name,
          last_name: employee.last_name,
          employee_type: employee.employee_type,
          address_id: addressId,
          availability: employee.availability,
          is_available: employee.is_available,
          user_phone: employee.phone,
          user_email: employee.email,
          is_pending: employee.is_pending,
        },
      });

      const { data: updatedEmployee, error: employeeUpdateError } =
        await supabase
          .from("employees")
          .update({
            first_name: employee.first_name,
            last_name: employee.last_name,
            employee_type: employee.employee_type,
            address_id: addressId,
            availability: employee.availability,
            is_available: employee.is_available,
            user_phone: employee.phone,
            user_email: employee.email,
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
        setError(`Failed to update employee: ${employeeUpdateError.message}`);
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
        employee.employee_type !== "admin" &&
        employee.employee_type !== "pending"
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

      setSuccess("Employee information updated successfully");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("An unexpected error occurred");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (success) return <p className="text-green-600">{success}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <h2 className="text-xl font-semibold">Employee Info</h2>
      <input
        name="first_name"
        value={employee.first_name ?? ""}
        onChange={handleEmployeeChange}
        placeholder="First Name"
      />
      <input
        name="last_name"
        value={employee.last_name ?? ""}
        onChange={handleEmployeeChange}
        placeholder="Last Name"
      />
      <input
        name="phone"
        value={employee.phone ?? ""}
        onChange={handleEmployeeChange}
        placeholder="Phone Number"
      />
      <input
        name="email"
        value={employee.email ?? ""}
        onChange={handleEmployeeChange}
        placeholder="Email"
      />

      <h2 className="text-xl font-semibold">Address</h2>
      <input
        name="street"
        value={address.street ?? ""}
        onChange={handleAddressChange}
        placeholder="Street"
      />
      <input
        name="city"
        value={address.city ?? ""}
        onChange={handleAddressChange}
        placeholder="City"
      />
      <input
        name="province"
        value={address.province ?? ""}
        onChange={handleAddressChange}
        placeholder="Province"
      />
      <input
        name="postal_code"
        value={address.postal_code ?? ""}
        onChange={handleAddressChange}
        placeholder="Postal Code"
      />
      <input
        name="country"
        value={address.country ?? ""}
        onChange={handleAddressChange}
        placeholder="Country"
      />
      <div>
        <label>
          <input
            type="checkbox"
            checked={
              ((employee.availability as string[]) || []).length ===
              daysOfWeek.length
            }
            onChange={handleSelectAll}
          />{" "}
          Select All
        </label>
        <div>
          {daysOfWeek.map((day) => (
            <label key={day}>
              <input
                type="checkbox"
                checked={((employee.availability as string[]) || []).includes(
                  day
                )}
                onChange={() => handleDaySelection(day)}
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="button">
        Save Changes
      </button>
    </form>
  );
}
