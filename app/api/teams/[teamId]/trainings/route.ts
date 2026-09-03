import {z} from "zod";
import {apiError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";

const schema=z.object({title:z.string().trim().min(1).max(100).default("Training"),date:z.coerce.date(),startTime:z.string().regex(/^\d{2}:\d{2}$/).nullable(),endTime:z.string().regex(/^\d{2}:\d{2}$/).nullable(),venue:z.string().trim().max(200).nullable(),notes:z.string().trim().max(1000).nullable(),repeatWeeks:z.number().int().min(1).max(52).default(1)});
export async function POST(request:Request,{params}:{params:Promise<{teamId:string}>}){try{const {teamId}=await params,user=await authorizeTeamManagement(teamId),input=schema.parse(await request.json()),dates=Array.from({length:input.repeatWeeks},(_,index)=>new Date(input.date.getTime()+index*7*86400000));await db.training.createMany({data:dates.map(date=>({teamId,title:input.title,date,startTime:input.startTime,endTime:input.endTime,venue:input.venue||null,notes:input.notes||null,createdById:user.id}))});return ok({count:dates.length},{status:201})}catch(error){return apiError(error)}}
