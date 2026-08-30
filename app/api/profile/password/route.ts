import {apiError,HttpError,ok} from "@/lib/api";
import {hashPassword,requireUser,verifyPassword} from "@/lib/auth";
import {db} from "@/lib/db";
import {strongPasswordSchema} from "@/lib/validation";
import {z} from "zod";

const schema=z.object({currentPassword:z.string().min(8).max(128),newPassword:strongPasswordSchema,confirmPassword:z.string()}).refine(value=>value.newPassword===value.confirmPassword,{path:["confirmPassword"],message:"Wachtwoorden komen niet overeen"});

export async function POST(request:Request){
  try{
    const user=await requireUser(),input=schema.parse(await request.json());
    const stored=await db.user.findUniqueOrThrow({where:{id:user.id},select:{passwordHash:true}});
    if(!await verifyPassword(stored.passwordHash,input.currentPassword))throw new HttpError(401,"INVALID_PASSWORD","Huidig wachtwoord is onjuist");
    await db.$transaction([
      db.user.update({where:{id:user.id},data:{passwordHash:await hashPassword(input.newPassword)}}),
      db.session.deleteMany({where:{userId:user.id}}),
    ]);
    return ok({changed:true});
  }catch(error){return apiError(error)}
}
