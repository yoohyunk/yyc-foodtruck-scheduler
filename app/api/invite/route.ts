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

  if (!wage || wage === "") {
    return NextResponse.json({ error: "Wage is required" }, { status: 400 });
  }

  if (!employeeType || employeeType === "") {
    return NextResponse.json(
      { error: "Employee type is required" },
      { status: 400 }
    );
  }

  if (!["Driver", "Server"].includes(employeeType)) {
    return NextResponse.json(
      { error: "Employee type must be either 'Driver' or 'Server'" },
      { status: 400 }
    );
  }

  const wageNumber = Number(wage);
  if (isNaN(wageNumber) || wageNumber <= 0) {
    return NextResponse.json(
      { error: "Wage must be a positive number" },
      { status: 400 }
    );
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
    redirectTo: `https://yyc-foodtruck-scheduler.vercel.app/set-password?email=${encodeURIComponent(email)}`,
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

  const wageData = {
    employee_id: employeeData?.employee_id,
    hourly_wage: wageNumber,
    start_date: new Date().toISOString(),
  };

  await supabase.from("wage").insert(wageData);

  return NextResponse.json({ user: data.user });
}
