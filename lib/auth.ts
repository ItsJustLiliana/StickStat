import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { db } from "./db";
import type {ClubRole,TeamRole} from "@/generated/prisma/client";
import { HttpError } from "./api";
import {useSecureSessionCookie} from "./session-cookie";

const COOKIE = "stickstat_session";
const SESSION_DAYS = 30;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export const hashPassword = (password: string) => hash(password, { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 });
export const verifyPassword = (passwordHash: string, password: string) => verify(passwordHash, password);

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: useSecureSessionCookie(), path: "/", expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  jar.delete(COOKIE);
}

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { include: { clubMemberships: true, teamMemberships: true } } } });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

export async function requireUser() { const user = await currentUser(); if (!user) throw new HttpError(401, "UNAUTHENTICATED", "Log in om door te gaan"); return user; }
export async function requirePlatformAdmin() { const user = await requireUser(); if (user.platformRole !== "admin") throw new HttpError(403, "FORBIDDEN", "Geen toegang"); return user; }

const teamWriteRoles: TeamRole[] = ["team_admin", "coach"];
export async function authorizeTeam(teamId: string, write = false) {
  const user = await requireUser();
  if (user.platformRole === "admin") return user;
  const membership = user.teamMemberships.find((m) => m.teamId === teamId);
  if (!membership || (write && !teamWriteRoles.includes(membership.role))) throw new HttpError(403, "FORBIDDEN", "Geen toegang tot dit team");
  return user;
}
export async function authorizeClub(clubId: string, write = false) {
  const user = await requireUser();
  if (user.platformRole === "admin") return user;
  const membership = user.clubMemberships.find((m) => m.clubId === clubId);
  const allowed: ClubRole[] = write ? ["club_admin"] : ["club_admin", "member"];
  if (!membership || !allowed.includes(membership.role)) throw new HttpError(403, "FORBIDDEN", "Geen toegang tot deze club");
  return user;
}
export {hasPlatformRole} from "./permissions";
