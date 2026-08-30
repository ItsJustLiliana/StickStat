import { apiError, ok } from "@/lib/api"; import { requireUser } from "@/lib/auth";
export async function GET(){try{const u=await requireUser();return ok({id:u.id,name:u.name,email:u.email,platformRole:u.platformRole,clubMemberships:u.clubMemberships,teamMemberships:u.teamMemberships});}catch(e){return apiError(e);}}
