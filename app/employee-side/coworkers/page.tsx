"use client";

import { useEffect, useState } from "react";
import { employeesApi } from "@/lib/supabase/employees";
import { Employee } from "@/app/types";

export default function CoworkersPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    employeesApi
      .getAllEmployees()
      .then(setEmployees)
      .catch(() => setError("Failed to fetch employees"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className=" bg-gray-50 flex items-center justify-center min-h-screen py-12 px-6 mt-10">
      <div className="w-full max-w-7xl">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="table-fixed w-full bg-white shadow rounded">
            <thead>
              <tr>
                <th className="w-1/3">Name</th>
                <th className="w-1/3">Role</th>
                <th className="w-1/3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td>{employee.employee_type}</td>
                  <td>{employee.user_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
