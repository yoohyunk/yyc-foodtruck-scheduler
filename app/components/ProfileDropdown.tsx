import React from "react";
import Link from "next/link";
import { FiUser, FiLogOut } from "react-icons/fi";

interface ProfileDropdownProps {
  isVisible: boolean;
  employeeId: string;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileDropdown({
  isVisible,
  employeeId,
  onClose,
  onLogout,
}: ProfileDropdownProps) {
  if (!isVisible) return null;

  return (
    <div className="profile-dropdown">
      <Link
        href={`/employees/${employeeId}`}
        className="dropdown-item"
        onClick={onClose}
      >
        <FiUser size={16} />
        <span>My Profile</span>
      </Link>
      <button className="dropdown-item" onClick={onLogout}>
        <FiLogOut size={16} />
        <span>Logout</span>
      </button>
    </div>
  );
}
