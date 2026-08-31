import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";
import {Prisma} from "@/generated/prisma/client";

export function ok<T>(data: T, init?: ResponseInit) { return NextResponse.json({ data }, init); }
export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Ongeldige invoer", details: error.flatten() } }, { status: 400 });
  if (error instanceof HttpError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")return NextResponse.json({error:{code:"CONFLICT",message:"Deze gegevens zijn al in gebruik"}},{status:409});
  if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2025")return NextResponse.json({error:{code:"NOT_FOUND",message:"Het gevraagde onderdeel bestaat niet meer"}},{status:404});
  logger.error("Unhandled API error", { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Er ging iets mis" } }, { status: 500 });
}
export class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
