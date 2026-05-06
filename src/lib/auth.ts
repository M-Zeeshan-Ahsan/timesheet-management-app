import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { User } from "@/types/auth";

const DEMO_USER: User = {
  id: "user_test",
  name: "Test",
  email: "test@demo.com",
};

type Session = { token: string; userId: string; createdAt: number };

const sessions = new Map<string, Session>();

export function getDemoUser(): User {
  return DEMO_USER;
}

export function createSessionForUser(userId: string): string {
  const token = crypto.randomUUID();
  sessions.set(token, { token, userId, createdAt: Date.now() });
  return token;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export async function getUserIdFromRequestCookies(): Promise<string | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get("ts_session")?.value;
  if (!token) return null;

  const session = sessions.get(token);
  return session?.userId ?? null;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: "ts_session",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: "ts_session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
  });
}
