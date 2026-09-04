import {apiError,HttpError,ok} from "@/lib/api";
import {fetchWebsiteRelease} from "@/lib/app-release-feed";
import {requirePlatformAdmin} from "@/lib/auth";
import {db} from "@/lib/db";

export async function POST(){
  try{
    const user=await requirePlatformAdmin(),websiteRelease=await fetchWebsiteRelease(),latest=await db.appRelease.findFirst({orderBy:{buildNumber:"desc"}});
    if(latest&&latest.buildNumber>websiteRelease.buildNumber)throw new HttpError(409,"OLDER_WEBSITE_RELEASE","De nieuwste website-release is ouder dan de huidige StickStat-release");
    const existing=await db.appRelease.findFirst({where:{OR:[{version:websiteRelease.version},{buildNumber:websiteRelease.buildNumber}]}});
    if(existing){
      if(existing.version!==websiteRelease.version||existing.buildNumber!==websiteRelease.buildNumber)throw new HttpError(409,"RELEASE_CONFLICT","Versie en buildnummer botsen met een bestaande release");
      const release=await db.appRelease.update({where:{id:existing.id},data:{apkPath:websiteRelease.downloadUrl,sha256:websiteRelease.sha256,notes:websiteRelease.notes||null}});
      return ok({...release,alreadyPublished:true});
    }
    const release=await db.$transaction(async transaction=>{const created=await transaction.appRelease.create({data:{version:websiteRelease.version,buildNumber:websiteRelease.buildNumber,apkPath:websiteRelease.downloadUrl,sha256:websiteRelease.sha256,notes:websiteRelease.notes||null,publishedById:user.id}}),users=await transaction.user.findMany({select:{id:true}});if(users.length)await transaction.notification.createMany({data:users.map(account=>({userId:account.id,type:"app_update",title:`StickStat ${websiteRelease.version} is beschikbaar`,body:"Download en installeer de nieuwste versie van de app.",link:"/updates"}))});return created});
    return ok({...release,alreadyPublished:false},{status:201});
  }catch(error){return apiError(error)}
}
