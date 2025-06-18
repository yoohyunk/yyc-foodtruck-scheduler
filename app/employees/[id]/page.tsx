"use client";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
  ReactElement,
} from "react";
import { createClient } from "@/lib/supabase/client";

export default function EditEmployeePage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    address: "",
    role: "",
    email: "",
    phone: "",
    wage: "",
    isAvailable: false,
    availability: [] as string[],
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

    try {
      // Parse address
      const addressParts = formData.address.split(", ");
      const street = addressParts[0] || "";
      const city = addressParts[1] || "";
      const province = addressParts[2] || "";

      // Update or create address
      let addressId: string | null = null;

      // Check if employee has existing address
      const { data: existingEmployee } = await supabase
        .from("employees")
        .select("address_id")
        .eq("employee_id", id)
        .single();

      if (existingEmployee?.address_id) {
        // Update existing address
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street,
            city,
            province,
          })
          .eq("id", existingEmployee.address_id);

        if (addressError) {
          console.error("Error updating address:", addressError);
          alert("Failed to update address.");
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
            country: "Canada",
            postal_code: "",
          })
          .select()
          .single();

        if (addressError) {
          console.error("Error creating address:", addressError);
          alert("Failed to create address.");
          return;
        }
        addressId = newAddress.id;
      }

      // Update employee
      const { error: employeeError } = await supabase
        .from("employees")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          employee_type: formData.role,
          address_id: addressId,
          user_email: formData.email,
          user_phone: formData.phone,
          is_available: formData.isAvailable,
          availability: formData.availability,
        })
        .eq("employee_id", id);

      if (employeeError) {
        console.error("Error updating employee:", employeeError);
        alert("Failed to update employee.");
        return;
      }

      // Update wage
      if (formData.wage) {
        const { data: existingWage } = await supabase
          .from("wage")
          .select("*")
          .eq("employee_id", id)
          .single();

        if (existingWage) {
          // Update existing wage
          const { error: wageError } = await supabase
            .from("wage")
            .update({
              hourly_wage: parseFloat(formData.wage),
            })
            .eq("employee_id", id);

          if (wageError) {
            console.error("Error updating wage:", wageError);
          }
        } else {
          // Create new wage
          const { error: wageError } = await supabase.from("wage").insert({
            employee_id: id as string,
            hourly_wage: parseFloat(formData.wage),
            start_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

          if (wageError) {
            console.error("Error creating wage:", wageError);
          }
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
    <div className="edit-employee-page">
      <div className="flex justify-between items-center mb-4">
        <button className="button" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Employee</h1>

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
          <label htmlFor="address" className="block font-medium">
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="input-field"
            required
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
            <option value="driver">Driver</option>
            <option value="server">Server</option>
            <option value="admin">Admin</option>
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
          <div className="availability-options">
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
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", gap: "2rem", marginLeft: "1rem" }}>
            <button type="submit" className="button">
              Save Changes
            </button>
            <button
              type="button"
              className="button bg-red-500 hover:bg-red-600 text-white"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Employee
            </button>
          </div>
        </div>
      </form>

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
    </div>
  );
}
