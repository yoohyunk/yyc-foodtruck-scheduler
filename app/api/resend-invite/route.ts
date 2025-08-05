// app/api/resend-invite/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  //   const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `https://yyc-foodtruck-scheduler.vercel.app/set-password`,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Invitation resent successfully." });
}
