import {createHash,randomUUID} from "node:crypto";
import {mkdir,open,rename,unlink} from "node:fs/promises";
import path from "node:path";
import {apiError,HttpError,ok} from "@/lib/api";
import {requirePlatformAdmin} from "@/lib/auth";
import {db} from "@/lib/db";

export const runtime="nodejs";
const MAX_APK_SIZE=250*1024*1024;
const RELEASE_DIRECTORY=path.join(process.cwd(),"public","releases");
async function removeUpload(filePath:string){await unlink(/* turbopackIgnore: true */ filePath).catch(()=>{})}

export async function POST(request:Request){
  let temporaryPath:string|undefined;
  try{
    const user=await requirePlatformAdmin();
    const version=request.headers.get("x-stickstat-version")??"",buildNumber=Number(request.headers.get("x-stickstat-build-number"));
    if(!/^\d+\.\d+\.\d+$/.test(version)||!Number.isInteger(buildNumber)||buildNumber<1)throw new HttpError(400,"INVALID_VERSION","Ongeldige appversie");
    if(request.headers.get("content-type")!=="application/vnd.android.package-archive")throw new HttpError(415,"INVALID_APK","Selecteer een APK-bestand");
    const declaredSize=Number(request.headers.get("content-length")??0);if(declaredSize>MAX_APK_SIZE)throw new HttpError(413,"APK_TOO_LARGE","De APK mag maximaal 250 MB zijn");
    const latest=await db.appRelease.findFirst({orderBy:{buildNumber:"desc"}});if(latest&&buildNumber<=latest.buildNumber)throw new HttpError(409,"BUILD_NUMBER_TOO_LOW","Het buildnummer moet hoger zijn dan de huidige release");
    if(!request.body)throw new HttpError(400,"EMPTY_APK","Het APK-bestand ontbreekt");

    await mkdir(RELEASE_DIRECTORY,{recursive:true});temporaryPath=path.join(RELEASE_DIRECTORY,`.upload-${randomUUID()}.apk`);
    const file=await open(/* turbopackIgnore: true */ temporaryPath,"wx",0o600),hash=createHash("sha256");let size=0;
    try{
      for await(const chunk of request.body as unknown as AsyncIterable<Uint8Array>){size+=chunk.byteLength;if(size>MAX_APK_SIZE)throw new HttpError(413,"APK_TOO_LARGE","De APK mag maximaal 250 MB zijn");hash.update(chunk);await file.write(chunk)}
      if(size<4)throw new HttpError(400,"INVALID_APK","Het APK-bestand is leeg of beschadigd");
      const signature=Buffer.alloc(2);await file.read(signature,0,2,0);if(signature.toString("ascii")!=="PK")throw new HttpError(400,"INVALID_APK","Dit bestand is geen geldige APK-container");
    }finally{await file.close()}

    const filename=`StickStat-${version}.apk`,target=path.join(RELEASE_DIRECTORY,filename);await rename(/* turbopackIgnore: true */ temporaryPath,target);temporaryPath=undefined;const sha256=hash.digest("hex");
    try{
      return ok(await db.$transaction(async transaction=>{const release=await transaction.appRelease.create({data:{version,buildNumber,apkPath:`/releases/${filename}`,sha256,publishedById:user.id}}),users=await transaction.user.findMany({select:{id:true}});if(users.length)await transaction.notification.createMany({data:users.map(account=>({userId:account.id,type:"app_update",title:`StickStat ${version} is beschikbaar`,body:"Download en installeer de nieuwste versie van de app.",link:"/updates"}))});return release}),{status:201});
    }catch(error){await removeUpload(target);throw error}
  }catch(error){if(temporaryPath)await removeUpload(temporaryPath);return apiError(error)}
}
