import { NextRequest } from "next/server";
import { apiError, HttpError, ok } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
export async function POST(request:NextRequest){try{ const ip=request.headers.get("x-forwarded-for")?.split(",")[0]??"local"; try{rateLimit(`login:${ip}`);}catch{throw new HttpError(429,"RATE_LIMITED","Te veel pogingen. Probeer later opnieuw.");} const input=loginSchema.parse(await request.json()); const user=await db.user.findUnique({where:{email:input.email}}); if(!user||!(await verifyPassword(user.passwordHash,input.password)))throw new HttpError(401,"INVALID_CREDENTIALS","E-mail of wachtwoord is onjuist"); await createSession(user.id); return ok({id:user.id,name:user.name,email:user.email,platformRole:user.platformRole}); }catch(e){return apiError(e);}}
