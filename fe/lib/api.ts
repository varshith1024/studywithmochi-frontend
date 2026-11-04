const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// All calls send the HttpOnly `access_token` cookie set by the backend on login.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    let message = "Something went wrong. Try again.";
    try { message = (await res.json()).message ?? message; } catch {}
    throw new ApiError(res.status, message);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export type User = { id: number; name: string; email: string };
export const getMe = () => api<User>("/api/auth/me");
export const logout = () => api<void>("/api/auth/logout", { method: "POST" });

export type Subject = { id: number; name: string };
export type Progress = { focusEnergy: number; totalStudyMinutes: number };
export type StudySession = {
  id: number; subjectId: number; durationMinutes: number;
  remainingSeconds: number; status: "RUNNING" | "PAUSED" | string;
};