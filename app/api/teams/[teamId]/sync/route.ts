import { apiError, ok } from "@/lib/api"; import { authorizeTeam } from "@/lib/auth"; import { syncTeam } from "@/services/sync";
export async function POST(_:Request,{params}:{params:Promise<{teamId:string}>}){try{const {teamId}=await params;await authorizeTeam(teamId,true);return ok(await syncTeam(teamId));}catch(e){return apiError(e);}}
