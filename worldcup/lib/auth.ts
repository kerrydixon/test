import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Single-admin auth: the organiser logs in with ADMIN_PASSWORD. We store a
// stateless HMAC token in an httpOnly cookie rather than a server session.

const COOKIE_NAME = "wc_admin";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "changeme";
}

export function expectedToken(): string {
  return createHmac("sha256", adminPassword()).update("wc26-admin").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(password: string): boolean {
  return safeEqual(password, adminPassword());
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return !!token && safeEqual(token, expectedToken());
}

/** Use inside admin server actions / route handlers to set the session cookie. */
export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Guard a server component / page; redirects to the login screen if not authed. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
