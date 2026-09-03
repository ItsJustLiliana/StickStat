import {apiError,ok} from "@/lib/api";import {requireUser} from "@/lib/auth";import {db} from "@/lib/db";
export async function GET(){try{const user=await requireUser();return ok(await db.notification.findMany({where:{userId:user.id},orderBy:{createdAt:"desc"},take:30}))}catch(error){return apiError(error)}}
export async function PATCH(){try{const user=await requireUser();const result=await db.notification.updateMany({where:{userId:user.id,readAt:null},data:{readAt:new Date()}});return ok({updated:result.count})}catch(error){return apiError(error)}}
