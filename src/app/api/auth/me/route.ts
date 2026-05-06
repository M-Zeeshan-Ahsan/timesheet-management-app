import { NextResponse } from "next/server";
import { getDemoUser, getUserIdFromRequestCookies } from "@/lib/auth";

export async function GET() {
  const userId = await getUserIdFromRequestCookies();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const demoUser = getDemoUser();

  if (demoUser.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: demoUser });
}
