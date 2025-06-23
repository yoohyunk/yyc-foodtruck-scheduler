import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, firstName, lastName, employeeType, wage } =
    await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Log environment variables for debugging (remove in production)
  console.log("Environment check:", {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  });

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password`;
  console.log("Redirect URL:", redirectUrl);

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("Invite successful for:", email);

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

  await supabase.from("wages").insert({
    employee_id: employeeData?.employee_id,
    wage: wage,
  });

  return NextResponse.json({ user: data.user });
}
