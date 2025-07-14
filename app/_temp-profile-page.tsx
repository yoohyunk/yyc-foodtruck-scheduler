"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { FiUser, FiMail, FiMapPin, FiDollarSign, FiGift } from "react-icons/fi";

const MOCK_PROFILE = {
  name: "Jane Doe",
  address: "123 Main St, Calgary, AB",
  email: "jane.doe@email.com",
  wage: 20,
  birthday: "1995-06-15",
};

export default function EmployeeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(MOCK_PROFILE);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("employees")
        .select("name, address, email, wage, birthday")
        .eq("user_id", user.id)
        .single();

      if (!error && data) setProfile(data);
      else setProfile(MOCK_PROFILE);
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  if (loading) return <div className="profile-card">Loading...</div>;

  return (
    <div className="profile-card">
      <div className="w-24 h-24 rounded-full bg-primary-medium flex items-center justify-center mb-6 shadow">
        <FiUser className="text-white text-5xl" />
      </div>

      <h2 className="profile-title">{profile.name}</h2>

      <div className="profile-info space-y-4 mt-4">
        <p className="flex items-center">
          <FiMail className="mr-2 text-primary-medium" />
          <span className="label">Email:</span> {profile.email}
        </p>
        <p className="flex items-center">
          <FiMapPin className="mr-2 text-primary-medium" />
          <span className="label">Address:</span> {profile.address}
        </p>
        <p className="flex items-center">
          <FiDollarSign className="mr-2 text-primary-medium" />
          <span className="label">Wage:</span> ${profile.wage}/hr
        </p>
        <p className="flex items-center">
          <FiGift className="mr-2 text-primary-medium" />
          <span className="label">Birthday:</span> {profile.birthday}
        </p>
      </div>

      <a
        href="/employee-side/profile/edit"
        className="mt-8 inline-block px-6 py-2 rounded bg-primary-medium text-white font-semibold hover:bg-primary-dark transition"
      >
        Edit Profile
      </a>
    </div>
  );
}
