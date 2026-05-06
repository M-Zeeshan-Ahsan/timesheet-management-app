import { apiFetch } from "@/services/http";
import type { AuthMeResponse, User } from "@/types/auth";

type LoginResponse = { user: User };

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return data.user;
}

export async function logout(): Promise<{ ok: true }> {
  return await apiFetch<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function me(): Promise<User> {
  const data = await apiFetch<AuthMeResponse>("/api/auth/me");
  return data.user;
}
