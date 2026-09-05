import {z} from "zod";
import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
const schema=z.object({locked:z.boolean(),teamId:z.string().cuid()});
export async function PUT(request:Request,{params}:{params:Promise<{matchId:string}>}){try{const {matchId}=await params,input=schema.parse(await request.json());const event=await db.match.findUnique({where:{id:matchId}});if(!event||![event.homeTeamId,event.awayTeamId].includes(input.teamId))throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");await authorizeTeamAdmin(input.teamId);return ok(await db.matchTeamPlan.upsert({where:{matchId_teamId:{matchId,teamId:input.teamId}},create:{matchId,teamId:input.teamId,attendanceLocked:input.locked},update:{attendanceLocked:input.locked}}));}catch(error){return apiError(error)}}
