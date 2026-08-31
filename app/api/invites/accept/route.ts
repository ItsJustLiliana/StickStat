import {apiError,HttpError,ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {hashInviteToken,validInviteToken} from "@/lib/team-invites";
import {z} from "zod";

const schema=z.object({token:z.string().refine(validInviteToken)});
export async function POST(request:Request){
  try{
    const user=await requireUser(),{token}=schema.parse(await request.json()),tokenHash=hashInviteToken(token),teamId=await db.$transaction(async transaction=>{const invite=await transaction.teamInvite.findUnique({where:{tokenHash},select:{id:true,teamId:true,usedAt:true,expiresAt:true}});if(!invite||invite.usedAt||invite.expiresAt<=new Date())throw new HttpError(410,"INVITE_INVALID","Deze uitnodiging is verlopen of al gebruikt");const claimed=await transaction.teamInvite.updateMany({where:{id:invite.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date(),usedById:user.id}});if(!claimed.count)throw new HttpError(410,"INVITE_INVALID","Deze uitnodiging is verlopen of al gebruikt");await transaction.teamMembership.upsert({where:{userId_teamId:{userId:user.id,teamId:invite.teamId}},update:{},create:{userId:user.id,teamId:invite.teamId,roles:[]}});return invite.teamId});
    return ok({teamId});
  }catch(error){return apiError(error)}
}
