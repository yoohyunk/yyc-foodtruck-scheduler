// app/admin/pending-employees/PendingEmployeesTable.tsx
"use client";
import { useState, useMemo } from "react";
import { ResendInviteButton } from "./ResendButton";
import { SearchInput } from "./SearchInput";
import { Employee } from "../types";

type PendingEmployee = Employee & {
  email?: string;
  invited_at?: string;
};

export function PendingEmployeesTable({
  employees,
}: {
  employees: PendingEmployee[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter(
      (emp) =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(term) ||
        (emp.first_name && emp.first_name.toLowerCase().includes(term)) ||
        (emp.last_name && emp.last_name.toLowerCase().includes(term))
    );
  }, [employees, search]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <SearchInput onSearch={setSearch} />
      <table className="min-w-full ">
        <thead>
          <tr>
            <th className="p-2 ">Email</th>
            <th className="p-2 ">Name</th>
            <th className="p-2 ">Invited At</th>
            <th className="p-2 ">Resend Invite</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-2 text-center">
                No matching employee.
              </td>
            </tr>
          ) : (
            filtered.map((emp) => (
              <tr key={emp.user_id}>
                <td className="p-2 ">{emp.email}</td>
                <td className="p-2 ">
                  {emp.first_name} {emp.last_name}
                </td>
                <td className="p-2 ">
                  {emp.invited_at
                    ? new Date(emp.invited_at).toLocaleString()
                    : "N/A"}
                </td>
                <td className="p-2 ">
                  {emp.email && <ResendInviteButton email={emp.email} />}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
