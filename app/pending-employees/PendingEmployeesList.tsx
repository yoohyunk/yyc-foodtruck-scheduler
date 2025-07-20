// app/admin/pending-employees/PendingEmployeesTable.tsx
"use client";
import { useState, useMemo } from "react";
import { ResendInviteButton } from "./ResendButton";
import { SearchInput } from "./SearchInput";
import { Employee } from "../types";
import ErrorModal from "../components/ErrorModal";
import { ValidationError } from "@/lib/formValidation";

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
  
  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalErrors, setErrorModalErrors] = useState<ValidationError[]>([]);
  const [errorModalTitle, setErrorModalTitle] = useState<string>("");
  const [errorModalType, setErrorModalType] = useState<"error" | "success">("error");

  // Error handling helper functions
  const showError = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("error");
    setShowErrorModal(true);
  };

  const showSuccess = (title: string, message: string) => {
    setErrorModalTitle(title);
    setErrorModalErrors([{ field: "general", message }]);
    setErrorModalType("success");
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

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
    <>
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <SearchInput onSearch={setSearch} />
        
        {/* Mobile view - Cards */}
        <div className="w-full md:hidden">
          {filtered.length === 0 ? (
            <div className="text-center p-4" style={{ color: "var(--text-muted)" }}>
              No matching employee.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((emp, index) => (
                <div 
                  key={emp.user_id} 
                  className="card"
                  style={{
                    background: "var(--surface)",
                    border: "2px solid var(--border)",
                    borderRadius: "1.5rem",
                    padding: "2rem",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                    transition: "var(--hover-transition)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Card accent bar based on index */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "6px",
                      background: index % 4 === 0 ? "var(--primary-light)" :
                                 index % 4 === 1 ? "var(--secondary-light)" :
                                 index % 4 === 2 ? "var(--secondary-medium)" :
                                 "var(--primary-light)"
                    }}
                  />
                  
                  <div className="space-y-3" style={{ position: "relative", zIndex: 1 }}>
                    <div>
                      <h3 
                        className="font-semibold text-lg"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {emp.first_name} {emp.last_name}
                      </h3>
                      <p 
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {emp.email}
                      </p>
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <p>Invited: {emp.invited_at
                        ? new Date(emp.invited_at).toLocaleString()
                        : "N/A"}</p>
                    </div>
                    <div className="pt-2">
                      {emp.email && (
                        <ResendInviteButton 
                          email={emp.email} 
                          onSuccess={(message) => showSuccess("Success", message)}
                          onError={(message) => showError("Error", message)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="min-w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--background-light)" }}>
                <th 
                  className="p-3 text-left font-semibold"
                  style={{ 
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)"
                  }}
                >
                  Email
                </th>
                <th 
                  className="p-3 text-left font-semibold"
                  style={{ 
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)"
                  }}
                >
                  Name
                </th>
                <th 
                  className="p-3 text-left font-semibold"
                  style={{ 
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)"
                  }}
                >
                  Invited At
                </th>
                <th 
                  className="p-3 text-left font-semibold"
                  style={{ 
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)"
                  }}
                >
                  Resend Invite
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td 
                    colSpan={4} 
                    className="p-3 text-center"
                    style={{ 
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)"
                    }}
                  >
                    No matching employee.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr 
                    key={emp.user_id} 
                    className="hover:bg-gray-50"
                    style={{ 
                      transition: "var(--hover-transition)",
                      background: "var(--surface)"
                    }}
                  >
                    <td 
                      className="p-3"
                      style={{ 
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)"
                      }}
                    >
                      {emp.email}
                    </td>
                    <td 
                      className="p-3"
                      style={{ 
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)"
                      }}
                    >
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td 
                      className="p-3"
                      style={{ 
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)"
                      }}
                    >
                      {emp.invited_at
                        ? new Date(emp.invited_at).toLocaleString()
                        : "N/A"}
                    </td>
                    <td 
                      className="p-3"
                      style={{ 
                        border: "1px solid var(--border)"
                      }}
                    >
                      {emp.email && (
                        <ResendInviteButton 
                          email={emp.email}
                          onSuccess={(message) => showSuccess("Success", message)}
                          onError={(message) => showError("Error", message)}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        errors={errorModalErrors}
        title={errorModalTitle}
        type={errorModalType}
      />
    </>
  );
}
