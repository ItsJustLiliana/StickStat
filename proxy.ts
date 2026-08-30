import {NextRequest,NextResponse} from "next/server";
export function proxy(request:NextRequest){if(["POST","PUT","PATCH","DELETE"].includes(request.method)){const origin=request.headers.get("origin");if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:{code:"CSRF_REJECTED",message:"Ongeldige aanvraagbron"}},{status:403});}return NextResponse.next();}
export const config={matcher:"/api/:path*"};
