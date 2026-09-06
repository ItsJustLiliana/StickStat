import {mkdir,unlink,writeFile} from "node:fs/promises";
import path from "node:path";
import {apiError,HttpError,ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import {imageExtension,validImageBytes} from "@/lib/image-upload";

const uploadRoot=path.join(process.cwd(),"public","uploads","matches");
type PhotoKind="team"|"mvp";
const fields:Record<PhotoKind,"teamPhotoPath"|"mvpPhotoPath">={team:"teamPhotoPath",mvp:"mvpPhotoPath"};

async function removeStoredPhoto(photoPath:string|null){if(!photoPath?.startsWith("/uploads/matches/"))return;try{await unlink(path.join(uploadRoot,path.basename(photoPath)))}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error}}

async function matchForTeam(matchId:string,teamId:string){const match=await db.match.findUnique({where:{id:matchId},select:{homeTeamId:true,awayTeamId:true,teamPhotoPath:true,mvpPhotoPath:true}});if(!match||![match.homeTeamId,match.awayTeamId].includes(teamId))throw new HttpError(404,"NOT_FOUND","Wedstrijd niet gevonden");return match}

export async function POST(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{
    const {matchId}=await params,form=await request.formData(),teamId=form.get("teamId");
    if(typeof teamId!=="string")throw new HttpError(400,"INVALID_TEAM","Team ontbreekt");
    await authorizeTeamManagement(teamId);const match=await matchForTeam(matchId,teamId);await mkdir(uploadRoot,{recursive:true});
    const changes:Partial<Record<"teamPhotoPath"|"mvpPhotoPath",string>>={},oldPaths:(string|null)[]=[];
    for(const kind of ["team","mvp"] as const){const file=form.get(`${kind}Photo`);if(file===null)continue;if(!(file instanceof File)||file.size>4_000_000)throw new HttpError(400,"INVALID_PHOTO","Gebruik een JPG, PNG of WebP-afbeelding tot 4 MB");const extension=imageExtension(file.type),bytes=new Uint8Array(await file.arrayBuffer());if(!extension||!validImageBytes(file.type,bytes))throw new HttpError(400,"INVALID_PHOTO","Het bestand is geen geldige afbeelding");const field=fields[kind],photoPath=`/uploads/matches/${matchId}-${kind}-${Date.now()}.${extension}`;await writeFile(path.join(uploadRoot,path.basename(photoPath)),bytes);changes[field]=photoPath;oldPaths.push(match[field]);}
    if(!Object.keys(changes).length)throw new HttpError(400,"NO_PHOTO","Kies minimaal één foto");
    await db.match.update({where:{id:matchId},data:changes});await Promise.all(oldPaths.map(removeStoredPhoto));return ok(changes);
  }catch(error){return apiError(error)}
}

export async function DELETE(request:Request,{params}:{params:Promise<{matchId:string}>}){
  try{const {matchId}=await params,{teamId,kind}=await request.json() as {teamId?:string;kind?:PhotoKind};if(typeof teamId!=="string"||!(kind==="team"||kind==="mvp"))throw new HttpError(400,"INVALID_REQUEST","Ongeldige invoer");await authorizeTeamManagement(teamId);const match=await matchForTeam(matchId,teamId),field=fields[kind];await db.match.update({where:{id:matchId},data:{[field]:null}});await removeStoredPhoto(match[field]);return ok({removed:true});}catch(error){return apiError(error)}}
