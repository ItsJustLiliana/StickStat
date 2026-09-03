import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {copyFile,mkdir,readFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {z} from "zod";
import {apiError,HttpError,ok} from "@/lib/api";
import {requirePlatformAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
export const runtime="nodejs";
const run=promisify(execFile),schema=z.object({bump:z.enum(["patch","minor","major"])});
function bumpVersion(version:string,bump:"patch"|"minor"|"major"){const [major,minor,patch]=version.split(".").map(Number);return bump==="major"?`${major+1}.0.0`:bump==="minor"?`${major}.${minor+1}.0`:`${major}.${minor}.${patch+1}`}
export async function POST(request:Request){
 try{
  const user=await requirePlatformAdmin();if(process.env.ALLOW_APP_RELEASE_BUILDS!=="true")throw new HttpError(403,"BUILDS_DISABLED","Zet ALLOW_APP_RELEASE_BUILDS=true op de vertrouwde buildmachine");
  const input=schema.parse(await request.json()),root=process.cwd(),mobileRoot=path.join(root,"mobile"),latest=await db.appRelease.findFirst({orderBy:{buildNumber:"desc"}}),pubspec=await readFile(path.join(mobileRoot,"pubspec.yaml"),"utf8"),projectVersion=pubspec.match(/^version:\s*(\d+\.\d+\.\d+)/m)?.[1]??"0.0.0",version=bumpVersion(latest?.version??projectVersion,input.bump),buildNumber=(latest?.buildNumber??Number(pubspec.match(/^version:.*\+(\d+)/m)?.[1]??0))+1;
  if(process.platform==="win32")await run("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",path.join(root,"scripts","build-apk.ps1"),"-Version",version,"-BuildNumber",String(buildNumber)],{cwd:root,timeout:15*60_000,maxBuffer:1024*1024});
  else{for(const args of [["pub","get"],["analyze"],["test"],["build","apk","--release",`--build-name=${version}`,`--build-number=${buildNumber}`,`--dart-define=STICKSTAT_URL=${process.env.APP_URL??"http://localhost:4000"}`]])await run("flutter",args,{cwd:mobileRoot,timeout:15*60_000,maxBuffer:1024*1024})}
  const source=path.join(mobileRoot,"dist","StickStat.apk");if(process.platform!=="win32"){await mkdir(path.dirname(source),{recursive:true});await copyFile(path.join(mobileRoot,"build","app","outputs","flutter-apk","app-release.apk"),source)}
  const directory=path.join(root,"public","releases");await mkdir(directory,{recursive:true});const filename=`StickStat-${version}.apk`,target=path.join(directory,filename);await copyFile(source,target);const sha256=createHash("sha256").update(await readFile(target)).digest("hex");
  const release=await db.$transaction(async transaction=>{const created=await transaction.appRelease.create({data:{version,buildNumber,apkPath:`/releases/${filename}`,sha256,publishedById:user.id}}),users=await transaction.user.findMany({select:{id:true}});if(users.length)await transaction.notification.createMany({data:users.map(account=>({userId:account.id,type:"app_update",title:`StickStat ${version} is beschikbaar`,body:"Download en installeer de nieuwste versie van de app.",link:"/updates"}))});return created});return ok(release,{status:201});
 }catch(error){return apiError(error)}
}
