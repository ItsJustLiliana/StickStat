import {createHash,randomBytes} from "node:crypto";

export const inviteLifetimeMs=7*24*60*60_000;
export function createInviteToken(){return randomBytes(24).toString("base64url")}
export function hashInviteToken(token:string){return createHash("sha256").update(token).digest("hex")}
export function validInviteToken(token:string){return /^[A-Za-z0-9_-]{32}$/.test(token)}
