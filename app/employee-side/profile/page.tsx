"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { employeesApi } from "@/lib/supabase/employees";
import { addressesApi } from "@/lib/supabase/addresses";
import { Employee } from "@/app/types";
import { Address } from "@/app/types";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const supabase = createClient();

      // Get employee data
      const data = await employeesApi.getEmployeeByUserId(user.id);

      if (data) {
        // Get the current wage for this employee
        const { data: wageData } = await supabase
          .from("wage")
          .select("*")
          .eq("employee_id", data.employee_id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Combine the data
        setProfile({
          ...data,
          currentWage: wageData?.hourly_wage || 0,
        });
      }
    }
    fetchProfile();
  }, [user]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage("");

    try {
      await employeesApi.updateEmployee(profile.employee_id, {
        user_phone: profile.user_phone,
      });

      if (profile.addresses && profile.addresses.id) {
        await addressesApi.updateAddress(
          profile.addresses.id,
          profile.addresses
        );
      }

      setMessage("Profile updated!");
    } catch {
      setMessage("Error updating profile.");
    }
    setSaving(false);
  }

  const updateAddressField = (field: keyof Address, value: string) => {
    if (!profile) return;

    setProfile({
      ...profile,
      addresses: {
        ...profile.addresses,
        [field]: value,
      } as Address,
    });
  };

  if (!profile) return <div>Loading...</div>;

  const address: Partial<Address> = profile.addresses || {};

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm ">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <form>
          <div>
            <label>First Name:</label>
            <input value={profile.first_name || ""} disabled />
          </div>
          <div>
            <label>Last Name:</label>
            <input value={profile.last_name || ""} disabled />
          </div>
          <div>
            <label>Email:</label>
            <input value={profile.user_email || ""} disabled />
          </div>
          <div>
            <label>Wage:</label>
            <input value={profile.currentWage || ""} disabled />
          </div>
          <div>
            <label>Phone:</label>
            <input
              value={profile.user_phone || ""}
              onChange={(e) =>
                setProfile({ ...profile, user_phone: e.target.value })
              }
            />
          </div>
          <div>
            <label>Address:</label>
            <input
              value={address.street || ""}
              onChange={(e) => updateAddressField("street", e.target.value)}
              placeholder="Street"
            />
            <input
              value={address.city || ""}
              onChange={(e) => updateAddressField("city", e.target.value)}
              placeholder="City"
            />
            <input
              value={address.province || ""}
              onChange={(e) => updateAddressField("province", e.target.value)}
              placeholder="Province"
            />
            <input
              value={address.postal_code || ""}
              onChange={(e) =>
                updateAddressField("postal_code", e.target.value)
              }
              placeholder="Postal Code"
            />
            <input
              value={address.country || ""}
              onChange={(e) => updateAddressField("country", e.target.value)}
              placeholder="Country"
            />
          </div>

          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
        {message && <div>{message}</div>}
      </div>
    </div>
  );
}
