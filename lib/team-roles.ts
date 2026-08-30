import type {TeamRole} from "@/generated/prisma/client";

export const teamRoleLabels:Record<TeamRole,string>={
  team_admin:"Teambeheerder",
  coach:"Coach",
  trainer:"Trainer",
  player:"Speler",
  viewer:"Kijker",
};

export const teamWriteRoles:TeamRole[]=["team_admin","coach","trainer"];
export const teamManagementRoles:TeamRole[]=["team_admin","coach"];

export function hasAnyTeamRole(roles:TeamRole[],required:TeamRole[]){
  return roles.some(role=>required.includes(role));
}
