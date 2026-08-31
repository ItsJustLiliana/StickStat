"use client";

import {Settings} from "lucide-react";
import {useState} from "react";
import {ClubLogoEditor} from "@/components/club-logo-editor";
import {ManagementDialog} from "@/components/player-management-controls";
import {TeamInvitePanel} from "@/components/team-invite-panel";

type Invite={id:string;expiresAt:string;createdBy:string};

export function TeamSettingsControl({teamId,club,invites}:{teamId:string;club:{id:string;name:string;logoPath:string|null};invites:Invite[]}){
  const [open,setOpen]=useState(false);
  return <><button className="icon-button" type="button" title="Teaminstellingen" aria-label="Teaminstellingen" onClick={()=>setOpen(true)}><Settings size={18}/></button>{open&&<ManagementDialog title="Teaminstellingen" onClose={()=>setOpen(false)}><div className="team-settings-grid"><ClubLogoEditor club={club}/><TeamInvitePanel teamId={teamId} invites={invites}/></div></ManagementDialog>}</>;
}
