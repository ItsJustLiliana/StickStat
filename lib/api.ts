import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

export function ok<T>(data: T, init?: ResponseInit) { return NextResponse.json({ data }, init); }
export function apiError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Ongeldige invoer", details: error.flatten() } }, { status: 400 });
  if (error instanceof HttpError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  logger.error("Unhandled API error", { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Er ging iets mis" } }, { status: 500 });
}
export class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
