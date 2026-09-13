import { z } from "zod";
import { apiError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { searchCatalog } from "@/lib/team-catalog";

export async function GET(request: Request) {
  try {
    await requireUser();
    const query = z.string().trim().min(2).max(80).parse(new URL(request.url).searchParams.get("q"));
    return ok(await searchCatalog(query));
  } catch (error) { return apiError(error); }
}
