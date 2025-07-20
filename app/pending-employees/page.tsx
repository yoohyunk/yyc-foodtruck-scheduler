import { createClient, User } from "@supabase/supabase-js";
import { PendingEmployeesTable } from "./PendingEmployeesList";
import { Employee } from "../types";

type PendingEmployee = Employee & {
  email?: string;
  invited_at?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function PendingEmployeesPage() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return (
      <div 
        className="min-h-screen p-4"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-2xl font-bold mb-6 p-4"
            style={{ color: "var(--text-primary)" }}
          >
            Pending Employees
          </h1>
          <div 
            className="card text-center"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              color: "var(--text-muted)"
            }}
          >
            <p>Error loading pending employees: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingUsers = users.users.filter((user: User) => !user.confirmed_at);

  if (pendingUsers.length === 0) {
    return (
      <div 
        className="min-h-screen p-4"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-2xl font-bold mb-6 p-4"
            style={{ color: "var(--text-primary)" }}
          >
            Pending Employees
          </h1>
          <div 
            className="card text-center"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              color: "var(--text-muted)"
            }}
          >
            No pending employees.
          </div>
        </div>
      </div>
    );
  }

  const userIds = pendingUsers.map((user: User) => user.id);

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*")
    .in("user_id", userIds);

  if (empError) {
    return (
      <div 
        className="min-h-screen p-4"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-2xl font-bold mb-6 p-4"
            style={{ color: "var(--text-primary)" }}
          >
            Pending Employees
          </h1>
          <div 
            className="card text-center"
            style={{
              background: "var(--surface)",
              border: "2px solid var(--border)",
              borderRadius: "1.5rem",
              padding: "2rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              color: "var(--text-muted)"
            }}
          >
            <p>Error loading employee data: {empError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const pendingEmployeeList: PendingEmployee[] = employees.map(
    (emp: Employee) => {
      const user = pendingUsers.find((u: User) => u.id === emp.user_id);
      return {
        ...emp,
        email: user?.email,
        invited_at: user?.created_at,
      };
    }
  );

  return (
    <div 
      className="min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 
          className="text-2xl font-bold mb-6 p-4"
          style={{ color: "var(--text-primary)" }}
        >
          Pending Employees
        </h1>
        <PendingEmployeesTable employees={pendingEmployeeList} />
      </div>
    </div>
  );
}
