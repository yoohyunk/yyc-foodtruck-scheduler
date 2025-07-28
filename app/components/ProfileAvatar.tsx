import React from "react";
import Link from "next/link";

interface ProfileAvatarProps {
  initials: string;
  color: string;
  employeeId: string;
  isMobile: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function ProfileAvatar({
  initials,
  color,
  employeeId,
  isMobile,
  onClick,
}: ProfileAvatarProps) {
  const avatarElement = (
    <div className="profile-avatar" style={{ backgroundColor: color }}>
      <span className="profile-initials">{initials}</span>
    </div>
  );

  if (isMobile) {
    return (
      <button className="profile-button" onClick={onClick} title="Profile">
        {avatarElement}
      </button>
    );
  }

  return (
    <Link
      href={`/employees/${employeeId}`}
      className="profile-button"
      title="Profile"
    >
      {avatarElement}
    </Link>
  );
}
