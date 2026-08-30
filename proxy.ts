import {NextRequest,NextResponse} from "next/server";
import {isSameOriginHost} from "@/lib/csrf";

function rejected(){
  return NextResponse.json({error:{code:"CSRF_REJECTED",message:"Ongeldige aanvraagbron"}},{status:403});
}

export function proxy(request:NextRequest){
  if(["POST","PUT","PATCH","DELETE"].includes(request.method)){
    const origin=request.headers.get("origin");
    if(origin){
      const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
      const requestHost=forwardedHost??request.headers.get("host");
      if(!isSameOriginHost(origin,requestHost))return rejected();
    }
  }
  return NextResponse.next();
}
export const config={matcher:"/api/:path*"};
