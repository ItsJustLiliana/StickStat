import { apiError, ok } from "@/lib/api";
import { requirePlatformAdmin } from "@/lib/auth";
import { syncAllTeams } from "@/services/sync";

export async function POST() {
  try { await requirePlatformAdmin(); return ok(await syncAllTeams()); }
  catch (error) { return apiError(error); }
}
