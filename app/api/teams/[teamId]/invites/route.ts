import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {createInviteToken,hashInviteToken,inviteLifetimeMs} from "@/lib/team-invites";
import {z} from "zod";

const removeSchema=z.object({inviteId:z.string().cuid()});

export async function POST(_:Request,{params}:{params:Promise<{teamId:string}>}){
  try{
    const {teamId}=await params,actor=await authorizeTeamAdmin(teamId),pending=await db.teamInvite.count({where:{teamId,usedAt:null,expiresAt:{gt:new Date()}}});
    if(pending>=20)throw new HttpError(409,"TOO_MANY_INVITES","Trek eerst een openstaande uitnodiging in");
    const token=createInviteToken(),expiresAt=new Date(Date.now()+inviteLifetimeMs);
    const invite=await db.teamInvite.create({data:{teamId,createdById:actor.id,tokenHash:hashInviteToken(token),expiresAt},select:{id:true,expiresAt:true}});
    return ok({...invite,token},{status:201});
  }catch(error){return apiError(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{teamId:string}>}){
  try{const {teamId}=await params;await authorizeTeamAdmin(teamId);const {inviteId}=removeSchema.parse(await request.json()),removed=await db.teamInvite.deleteMany({where:{id:inviteId,teamId,usedAt:null}});if(!removed.count)throw new HttpError(404,"INVITE_NOT_FOUND","Openstaande uitnodiging niet gevonden");return ok({removed:true})}catch(error){return apiError(error)}
}
