"use client";
import { useState } from "react";

export function SearchInput({
  onSearch,
}: {
  onSearch: (term: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <input
      type="text"
      placeholder="Search by name"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onSearch(e.target.value);
      }}
      className="w-full md:w-60 p-3 mb-4"
      style={{
        border: "2px solid var(--border)",
        borderRadius: "0.75rem",
        background: "var(--surface)",
        color: "var(--text-primary)",
        transition: "var(--hover-transition)",
        fontSize: "1rem",
        outline: "none",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--primary-light)";
        e.target.style.boxShadow = "0 0 0 3px rgba(255, 213, 134, 0.1)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}
