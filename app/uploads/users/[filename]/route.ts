import {readFile} from "node:fs/promises";
import path from "node:path";

const types:Record<string,string>={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"};

export async function GET(_:Request,{params}:{params:Promise<{filename:string}>}){
  const {filename}=await params;
  if(path.basename(filename)!==filename||!/^[a-zA-Z0-9_-]+\.(?:jpe?g|png|webp)$/i.test(filename))return new Response("Niet gevonden",{status:404});
  try{
    const bytes=await readFile(path.join(process.cwd(),"public","uploads","users",filename)),extension=path.extname(filename).slice(1).toLowerCase();
    return new Response(new Uint8Array(bytes),{headers:{"content-type":types[extension]??"application/octet-stream","cache-control":"public, max-age=31536000, immutable","x-content-type-options":"nosniff"}});
  }catch(error){
    if((error as NodeJS.ErrnoException).code==="ENOENT")return new Response("Niet gevonden",{status:404});
    throw error;
  }
}
