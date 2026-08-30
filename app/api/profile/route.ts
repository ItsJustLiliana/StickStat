import {apiError,HttpError,ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {z} from "zod";

const schema=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(254).transform(value=>value.toLowerCase())});

export async function PATCH(request:Request){
  try{
    const user=await requireUser(),input=schema.parse(await request.json());
    const [player,duplicate]=await Promise.all([
      db.player.findUnique({where:{userId:user.id},select:{displayName:true}}),
      db.user.findFirst({where:{email:input.email,NOT:{id:user.id}},select:{id:true}}),
    ]);
    if(duplicate)throw new HttpError(409,"EMAIL_EXISTS","Dit e-mailadres is al in gebruik");
    const name=player?.displayName??input.name;
    return ok(await db.user.update({where:{id:user.id},data:{name,email:input.email},select:{id:true,name:true,email:true}}));
  }catch(error){return apiError(error)}
}
