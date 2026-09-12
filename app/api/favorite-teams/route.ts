import {z} from "zod";
import {apiError,ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
const schema=z.object({teamId:z.string().cuid()});
export async function POST(request:Request){try{const user=await requireUser(),{teamId}=schema.parse(await request.json());await db.favoriteTeam.upsert({where:{userId_teamId:{userId:user.id,teamId}},update:{},create:{userId:user.id,teamId}});return ok({favorite:true})}catch(error){return apiError(error)}}
export async function DELETE(request:Request){try{const user=await requireUser(),{teamId}=schema.parse(await request.json());await db.favoriteTeam.deleteMany({where:{userId:user.id,teamId}});return ok({favorite:false})}catch(error){return apiError(error)}}
export async function GET(){try{const user=await requireUser();const count=await db.favoriteTeam.count({where:{userId:user.id}});return ok({count})}catch(error){return apiError(error)}}
