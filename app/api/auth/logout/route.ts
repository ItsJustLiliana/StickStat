import { apiError, ok } from "@/lib/api"; import { destroySession } from "@/lib/auth";
export async function POST(){try{await destroySession();return ok({success:true});}catch(e){return apiError(e);}}
