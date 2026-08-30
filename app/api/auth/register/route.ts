import {NextRequest} from "next/server";
import {apiError,HttpError,ok} from "@/lib/api";
import {createSession,hashPassword} from "@/lib/auth";
import {db} from "@/lib/db";
import {rateLimit} from "@/lib/rate-limit";
import {registerSchema} from "@/lib/validation";

export async function POST(request:NextRequest){
  try{
    if(process.env.ALLOW_REGISTRATION==="false")throw new HttpError(403,"REGISTRATION_DISABLED","Registratie is uitgeschakeld");
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"local";
    try{rateLimit(`register:${ip}`,5,60*60_000)}catch{throw new HttpError(429,"RATE_LIMITED","Te veel registratiepogingen. Probeer later opnieuw.")}
    const input=registerSchema.parse(await request.json());
    if(await db.user.findUnique({where:{email:input.email},select:{id:true}}))throw new HttpError(409,"EMAIL_EXISTS","Er bestaat al een account met dit e-mailadres");
    const passwordHash=await hashPassword(input.password);
    const user=await db.user.create({data:{name:input.name,email:input.email,passwordHash,platformRole:"user"},select:{id:true,name:true,email:true,platformRole:true}});
    await createSession(user.id);
    return ok(user,{status:201});
  }catch(error){return apiError(error)}
}
