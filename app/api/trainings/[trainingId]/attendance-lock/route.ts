import {z} from "zod";
import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
const schema=z.object({locked:z.boolean(),teamId:z.string().cuid()});
export async function PUT(request:Request,{params}:{params:Promise<{trainingId:string}>}){try{const {trainingId}=await params,input=schema.parse(await request.json());const event=await db.training.findUnique({where:{id:trainingId}});if(!event||event.teamId!==input.teamId)throw new HttpError(404,"NOT_FOUND","Training niet gevonden");await authorizeTeamAdmin(event.teamId);return ok(await db.training.update({where:{id:trainingId},data:{attendanceLocked:input.locked}}));}catch(error){return apiError(error)}}
