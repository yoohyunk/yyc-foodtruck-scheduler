import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/app/translationAi/translator";

export async function POST(req: NextRequest) {
  try {
    const { text, to, from } = await req.json();
    if (!text || !to) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const result = await translateText({ text, to, from });
    return NextResponse.json({ text: result.text });
  } catch (error: unknown) {
    // Type guard for error with message
    let message = "Internal server error";
    if (
      typeof error === "object" &&
      error &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    console.error("Translation API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
