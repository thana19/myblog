import { createCookieSessionStorage, redirect } from "react-router";
import { getAnyAdminCredential } from "~/lib/db.server";

type DB = import("better-sqlite3").Database;

export interface UserSession {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export function createSessionStorage(secret: string) {
  return createCookieSessionStorage<{ user: UserSession }>({
    cookie: {
      name: "__myblog_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });
}

export async function getSession(
  request: Request,
  sessionStorage: ReturnType<typeof createSessionStorage>
) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function requireUser(
  request: Request,
  sessionStorage: ReturnType<typeof createSessionStorage>
): Promise<UserSession> {
  const session = await getSession(request, sessionStorage);
  const user = session.get("user");
  if (!user) {
    throw redirect("/login");
  }
  return user;
}

export async function getUserFromSession(
  request: Request,
  sessionStorage: ReturnType<typeof createSessionStorage>
): Promise<UserSession | null> {
  const session = await getSession(request, sessionStorage);
  return session.get("user") ?? null;
}

export async function requireSetup(db: DB): Promise<void> {
  const cred = await getAnyAdminCredential(db);
  if (!cred) throw redirect("/setup");
}
