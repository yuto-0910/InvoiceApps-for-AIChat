import { NextResponse } from "next/server";
import { parseSender } from "@/lib/parseSender";

export async function GET() {
  try {
    const sender = parseSender();
    return NextResponse.json(sender);
  } catch (error) {
    console.error("Failed to parse sender.md:", error);
    return NextResponse.json(
      { error: "Failed to load sender information" },
      { status: 500 }
    );
  }
}
