import { NextResponse } from "next/server";
import {
  createSessionForUser,
  getDemoUser,
  setSessionCookie,
} from "@/lib/auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: LoginBody = {};
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const demoUser = getDemoUser();
  const isValid = email.toLowerCase() === demoUser.email && password === "password";
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createSessionForUser(demoUser.id);
  const response = NextResponse.json({ user: demoUser });
  setSessionCookie(response, token);
  return response;
}
