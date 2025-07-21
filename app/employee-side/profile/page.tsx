"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { employeesApi } from "@/lib/supabase/employees";
import { addressesApi } from "@/lib/supabase/addresses";
import { Employee } from "@/app/types";
import { Address } from "@/app/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const data = await employeesApi.getEmployeeByUserId(user.id);
      setProfile(data);
    }
    fetchProfile();
  }, [user]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setMessage("");
    try {
      // Only update phone number
      await employeesApi.updateEmployee(profile.employee_id, {
        user_phone: profile.user_phone,
      });

      // If address is a nested object and needs a separate update:
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

  if (!profile) return <div>Loading...</div>;

  // Address fields (if present)
  const address: Partial<Address> = profile.addresses || {};

  return (
    <div>
      <h1>Profile</h1>
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
            onChange={(e) =>
              setProfile({
                ...profile,
                addresses: {
                  street: e.target.value,
                  city: address.city ?? null,
                  country: address.country ?? null,
                  created_at: address.created_at ?? "",
                  id: address.id ?? "",
                  latitude: address.latitude ?? null,
                  longitude: address.longitude ?? null,
                  postal_code: address.postal_code ?? null,
                  province: address.province ?? null,
                },
              })
            }
            placeholder="Street"
          />
          <input
            value={address.city || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                addresses: {
                  street: address.street ?? null,
                  city: e.target.value,
                  country: address.country ?? null,
                  created_at: address.created_at ?? "",
                  id: address.id ?? "",
                  latitude: address.latitude ?? null,
                  longitude: address.longitude ?? null,
                  postal_code: address.postal_code ?? null,
                  province: address.province ?? null,
                },
              })
            }
            placeholder="City"
          />
          <input
            value={address.province || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                addresses: {
                  street: address.street ?? null,
                  city: address.city ?? null,
                  country: address.country ?? null,
                  created_at: address.created_at ?? "",
                  id: address.id ?? "",
                  latitude: address.latitude ?? null,
                  longitude: address.longitude ?? null,
                  postal_code: address.postal_code ?? null,
                  province: e.target.value,
                },
              })
            }
            placeholder="Province"
          />
          <input
            value={address.postal_code || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                addresses: {
                  street: address.street ?? null,
                  city: address.city ?? null,
                  country: address.country ?? null,
                  created_at: address.created_at ?? "",
                  id: address.id ?? "",
                  latitude: address.latitude ?? null,
                  longitude: address.longitude ?? null,
                  postal_code: e.target.value,
                  province: address.province ?? null,
                },
              })
            }
            placeholder="Postal Code"
          />
          <input
            value={address.country || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                addresses: {
                  street: address.street ?? null,
                  city: address.city ?? null,
                  country: e.target.value,
                  created_at: address.created_at ?? "",
                  id: address.id ?? "",
                  latitude: address.latitude ?? null,
                  longitude: address.longitude ?? null,
                  postal_code: address.postal_code ?? null,
                  province: address.province ?? null,
                },
              })
            }
            placeholder="Country"
          />
        </div>

        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
      {message && <div>{message}</div>}
    </div>
  );
}
