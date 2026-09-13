import { z } from "zod";
import { apiError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { catalogTeams } from "@/lib/team-catalog";

const schema = z.object({ provider: z.enum(["hockeystanden", "hockey-belgium"]), clubId: z.string().min(1).max(160), clubName: z.string().min(1).max(160) });
export async function GET(request: Request) {
  try {
    await requireUser();
    const data = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return ok(await catalogTeams(data.provider, data.clubId, data.clubName));
  } catch (error) { return apiError(error); }
}
