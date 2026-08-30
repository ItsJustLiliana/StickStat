import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {apiError,HttpError,ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {imageExtension,validImageBytes} from "@/lib/image-upload";

const uploadRoot=path.join(process.cwd(),"public","uploads","users");

async function removeStoredPhoto(photoPath:string|null|undefined){
  if(!photoPath?.startsWith("/uploads/users/"))return;
  const filename=path.basename(photoPath),target=path.join(uploadRoot,filename);
  try{await unlink(target)}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}
}

export async function POST(request:Request){
  try{
    const user=await requireUser(),form=await request.formData(),file=form.get("photo");
    if(!(file instanceof File)||file.size>2_000_000)throw new HttpError(400,"INVALID_PHOTO","Gebruik een JPG, PNG of WebP-afbeelding tot 2 MB");
    const extension=imageExtension(file.type),bytes=new Uint8Array(await file.arrayBuffer());
    if(!extension||!validImageBytes(file.type,bytes))throw new HttpError(400,"INVALID_PHOTO","Het bestand is geen geldige afbeelding");
    await mkdir(uploadRoot,{recursive:true});
    const current=await db.user.findUniqueOrThrow({where:{id:user.id},select:{photoPath:true}}),filename=`${user.id}-${Date.now()}.${extension}`,photoPath=`/uploads/users/${filename}`;
    await writeFile(path.join(uploadRoot,filename),bytes);
    await db.user.update({where:{id:user.id},data:{photoPath}});
    await removeStoredPhoto(current.photoPath);
    return ok({photoPath});
  }catch(error){return apiError(error)}
}

export async function DELETE(){
  try{
    const user=await requireUser(),current=await db.user.findUniqueOrThrow({where:{id:user.id},select:{photoPath:true}});
    await db.user.update({where:{id:user.id},data:{photoPath:null}});
    await removeStoredPhoto(current.photoPath);
    return ok({removed:true});
  }catch(error){return apiError(error)}
}
