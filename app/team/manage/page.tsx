import {redirect} from "next/navigation";

export default async function LegacyTeamManage({searchParams}:{searchParams:Promise<{team?:string}>}){
  const {team}=await searchParams;
  redirect(team?`/players?team=${encodeURIComponent(team)}`:"/players");
}
