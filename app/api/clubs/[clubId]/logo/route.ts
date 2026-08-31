import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeClubBranding} from "@/lib/auth";
import {db} from "@/lib/db";
import {imageExtension,validImageBytes} from "@/lib/image-upload";

const uploadRoot=path.join(process.cwd(),"public","uploads","clubs");
async function removeOld(localPath:string|null){if(!localPath?.startsWith("/uploads/clubs/"))return;try{await unlink(path.join(uploadRoot,path.basename(localPath)))}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}}

export async function POST(request:Request,{params}:{params:Promise<{clubId:string}>}){
  try{
    const {clubId}=await params;await authorizeClubBranding(clubId);const form=await request.formData(),file=form.get("logo");
    if(!(file instanceof File)||file.size>2_000_000)throw new HttpError(400,"INVALID_LOGO","Gebruik PNG, JPG of WebP tot 2 MB");
    const extension=imageExtension(file.type),bytes=new Uint8Array(await file.arrayBuffer());
    if(!extension||!validImageBytes(file.type,bytes))throw new HttpError(400,"INVALID_LOGO","Het bestand is geen geldige afbeelding");
    const club=await db.club.findUnique({where:{id:clubId},select:{logoLocalPath:true}});if(!club)throw new HttpError(404,"CLUB_NOT_FOUND","Club niet gevonden");
    await mkdir(uploadRoot,{recursive:true});const filename=`${clubId}-${Date.now()}.${extension}`,logoLocalPath=`/uploads/clubs/${filename}`;await writeFile(path.join(uploadRoot,filename),bytes);await db.club.update({where:{id:clubId},data:{logoLocalPath}});await removeOld(club.logoLocalPath);return ok({logoLocalPath});
  }catch(error){return apiError(error)}
}
