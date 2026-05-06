import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie, deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("ts_session")?.value;

    if (token) {
      deleteSession(token);
      cookieStore.delete("ts_session");
    }

    const response = NextResponse.json({ ok: true });

    clearSessionCookie(response);

    return response;
  } catch (err) {
    console.error("Logout error:", err);

    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
