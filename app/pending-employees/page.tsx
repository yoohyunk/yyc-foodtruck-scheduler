// app/admin/pending-employees/page.tsx
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
    return <div>Error getting users: {error.message}</div>;
  }

  const pendingUsers = users.users.filter((user: User) => !user.confirmed_at);

  if (pendingUsers.length === 0) {
    return <div>No pending employees.</div>;
  }

  const userIds = pendingUsers.map((user: User) => user.id);

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*")
    .in("user_id", userIds);

  if (empError) {
    return <div>Error getting employees: {empError.message}</div>;
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

  return <PendingEmployeesTable employees={pendingEmployeeList} />;
}
