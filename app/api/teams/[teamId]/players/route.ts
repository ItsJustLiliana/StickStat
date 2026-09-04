import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeam,authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {playerSchema} from "@/lib/validation";
import {z} from "zod";

const playerIdSchema=z.object({playerId:z.string().cuid()});
const updateSchema=playerIdSchema.extend({
  firstName:z.string().trim().min(1).max(80).optional(),
  namePrefix:z.string().trim().max(30).nullable().optional(),
  lastName:z.string().trim().min(1).max(80).optional(),
  shirtNumber:z.number().int().min(0).max(999).nullable().optional(),
  position:z.string().trim().max(80).nullable().optional(),
  active:z.boolean().optional(),
  trainingMember:z.boolean().optional(),
  matchMember:z.boolean().optional(),
  isSubstitute:z.boolean().optional(),
});

export async function GET(_:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params;await authorizeTeam(teamId);
    const matchFilter={status:"finished" as const,OR:[{homeTeamId:teamId},{awayTeamId:teamId}]};
    return ok(await db.player.findMany({where:{teamId},include:{matchStats:{where:{match:matchFilter}},events:{where:{match:matchFilter}}},orderBy:[{active:"desc"},{lastName:"asc"},{namePrefix:"asc"},{firstName:"asc"}]}));
  }catch(error){return apiError(error)}
}

export async function POST(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{const {teamId}=await params;await authorizeTeamAdmin(teamId);const data=playerSchema.parse(await request.json()),displayName=[data.firstName,data.namePrefix,data.lastName].filter(Boolean).join(" ");return ok(await db.player.create({data:{teamId,...data,displayName}}),{status:201})}catch(error){return apiError(error)}
}

export async function PATCH(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params;await authorizeTeamAdmin(teamId);const input=updateSchema.parse(await request.json()),player=await db.player.findUnique({where:{id:input.playerId},select:{id:true,teamId:true,userId:true,firstName:true,namePrefix:true,lastName:true}});
    if(!player||player.teamId!==teamId)throw new HttpError(404,"PLAYER_NOT_FOUND","Speler niet gevonden");
    const firstName=input.firstName??player.firstName,namePrefix=input.namePrefix===undefined?player.namePrefix:input.namePrefix,lastName=input.lastName??player.lastName,displayName=[firstName,namePrefix,lastName].filter(Boolean).join(" "),data={firstName,namePrefix,lastName,displayName,...(input.shirtNumber!==undefined?{shirtNumber:input.shirtNumber}:{}),...(input.position!==undefined?{position:input.position}:{}),...(input.active!==undefined?{active:input.active}:{}),...(input.trainingMember!==undefined?{trainingMember:input.trainingMember}:{}),...(input.matchMember!==undefined?{matchMember:input.matchMember}:{}),...(input.isSubstitute!==undefined?{isSubstitute:input.isSubstitute}:{})};
    const updated=await db.$transaction(async transaction=>{const result=await transaction.player.update({where:{id:player.id},data});if(player.userId)await transaction.user.update({where:{id:player.userId},data:{name:displayName}});return result});
    return ok(updated);
  }catch(error){return apiError(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params;await authorizeTeamAdmin(teamId);const {playerId}=playerIdSchema.parse(await request.json());
    const player=await db.player.findUnique({where:{id:playerId},select:{id:true,teamId:true,userId:true}});
    if(!player||player.teamId!==teamId)throw new HttpError(404,"PLAYER_NOT_FOUND","Speler niet gevonden");
    const membership=player.userId?await db.teamMembership.findUnique({where:{userId_teamId:{userId:player.userId,teamId}}}):null,remainingRoles=membership?.roles.filter(role=>role!=="player")??[];
    await db.$transaction([db.player.update({where:{id:player.id},data:{active:false,userId:null}}),...(membership?(remainingRoles.length?[db.teamMembership.update({where:{userId_teamId:{userId:membership.userId,teamId}},data:{roles:remainingRoles}})]:[db.teamMembership.delete({where:{userId_teamId:{userId:membership.userId,teamId}}})]):[])]);
    return ok({removed:true});
  }catch(error){return apiError(error)}
}
