import {NextRequest} from "next/server";
import {apiError,HttpError,ok} from "@/lib/api";
import {createSession,hashPassword} from "@/lib/auth";
import {db} from "@/lib/db";
import {rateLimit} from "@/lib/rate-limit";
import {registerSchema} from "@/lib/validation";
import {hashInviteToken} from "@/lib/team-invites";

export async function POST(request:NextRequest){
  try{
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"local";
    try{rateLimit(`register:${ip}`,5,60*60_000)}catch{throw new HttpError(429,"RATE_LIMITED","Te veel registratiepogingen. Probeer later opnieuw.")}
    const input=registerSchema.parse(await request.json());
    if(process.env.ALLOW_REGISTRATION==="false"&&!input.inviteToken)throw new HttpError(403,"REGISTRATION_DISABLED","Registratie is uitgeschakeld");
    if(await db.user.findUnique({where:{email:input.email},select:{id:true}}))throw new HttpError(409,"EMAIL_EXISTS","Er bestaat al een account met dit e-mailadres");
    const passwordHash=await hashPassword(input.password);
    const user=await db.$transaction(async transaction=>{
      const invite=input.inviteToken?await transaction.teamInvite.findUnique({where:{tokenHash:hashInviteToken(input.inviteToken)},select:{id:true,teamId:true,usedAt:true,expiresAt:true}}):null;
      if(input.inviteToken&&(!invite||invite.usedAt||invite.expiresAt<=new Date()))throw new HttpError(410,"INVITE_INVALID","Deze uitnodiging is verlopen of al gebruikt");
      const created=await transaction.user.create({data:{name:input.name,email:input.email,passwordHash,platformRole:"user"},select:{id:true,name:true,email:true,platformRole:true}});
      if(invite){const claimed=await transaction.teamInvite.updateMany({where:{id:invite.id,usedAt:null,expiresAt:{gt:new Date()}},data:{usedAt:new Date(),usedById:created.id}});if(!claimed.count)throw new HttpError(410,"INVITE_INVALID","Deze uitnodiging is verlopen of al gebruikt");await transaction.teamMembership.create({data:{userId:created.id,teamId:invite.teamId,roles:[]}})}
      return created;
    });
    await createSession(user.id);
    return ok(user,{status:201});
  }catch(error){return apiError(error)}
}
