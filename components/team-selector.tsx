"use client";
import {usePlatformAdmin} from "./access-context";
// Team switching is intentionally handled by the dashboard modal.
export function TeamSelector({}: {teams:{id:string;name:string;club:{name:string}}[];current:string}){const platformAdmin=usePlatformAdmin();if(!platformAdmin)return null;return null}
