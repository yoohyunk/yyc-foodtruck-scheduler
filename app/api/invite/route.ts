import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Type-safe environment variable access
function getEnvVar(key: string): string {
  const value = (
    process as unknown as { env: Record<string, string | undefined> }
  ).env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

const supabase = createClient(
  getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  getEnvVar("SUPABASE_SERVICE_ROLE_KEY")
);

export async function POST(request: Request) {
  const { email, firstName, lastName, employeeType, wage } =
    await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `https://yyc-foodtruck-scheduler.vercel.app/set-password`,
  });

  if (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: employeeData, error: employeeError } = await supabase
    .from("employees")
    .insert({
      user_id: data.user?.id,
      employee_type: employeeType,
      last_name: lastName,
      first_name: firstName,
      user_email: email,
      is_pending: true,
    })
    .select()
    .single();

  if (employeeError) {
    console.error("Employee error:", employeeError);
    return NextResponse.json({ error: employeeError.message }, { status: 500 });
  }

  await supabase.from("wage").insert({
    employee_id: employeeData?.employee_id,
    hourly_wage: wage,
    start_date: new Date().toISOString(),
  });

  return NextResponse.json({ user: data.user });
}
