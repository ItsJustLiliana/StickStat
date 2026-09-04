import {NextResponse} from "next/server";
import {fetchWebsiteRelease} from "@/lib/app-release-feed";
import {db} from "@/lib/db";

export const dynamic="force-dynamic";

export async function GET(request:Request){
  try{
    const release=await fetchWebsiteRelease();
    return NextResponse.json({data:release},{headers:{"Cache-Control":"no-store"}});
  }catch{
    const release=await db.appRelease.findFirst({orderBy:{buildNumber:"desc"},select:{version:true,buildNumber:true,apkPath:true,sha256:true,notes:true,createdAt:true}});
    if(!release)return NextResponse.json({data:null},{headers:{"Cache-Control":"no-store"}});
    const downloadUrl=/^https?:\/\//i.test(release.apkPath)?release.apkPath:new URL(release.apkPath,request.url).toString();
    return NextResponse.json({data:{...release,downloadUrl}},{headers:{"Cache-Control":"no-store"}});
  }
}
