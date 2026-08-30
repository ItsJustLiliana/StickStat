const signatures={
  "image/jpeg":(bytes:Uint8Array)=>bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,
  "image/png":(bytes:Uint8Array)=>[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value,index)=>bytes[index]===value),
  "image/webp":(bytes:Uint8Array)=>new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP",
} as const;

export function validImageBytes(type:string,bytes:Uint8Array){
  return type in signatures&&signatures[type as keyof typeof signatures](bytes);
}

export function imageExtension(type:string){return type==="image/jpeg"?"jpg":type==="image/png"?"png":type==="image/webp"?"webp":null}
