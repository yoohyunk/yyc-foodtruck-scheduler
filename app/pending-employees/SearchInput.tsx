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
      className="p-2 border rounded w-60 mb-4"
    />
  );
}
