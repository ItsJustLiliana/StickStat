import type {PlatformRole} from "@/generated/prisma/client";
export function hasPlatformRole(role:PlatformRole,required:PlatformRole){return required==="user"||role==="admin";}
