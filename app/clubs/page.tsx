import {PageShell} from "@/components/page-shell";
import {TeamBrowser} from "@/components/team-browser";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Clubs(){const user=await currentUser();if(!user)redirect("/login");const [clubs,favorites]=await Promise.all([db.club.findMany({include:{teams:{select:{id:true,name:true,shortName:true},orderBy:{name:"asc"}}},orderBy:{name:"asc"}}),db.favoriteTeam.findMany({where:{userId:user.id},select:{teamId:true}})]);return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Kijker</span><h1>Teams volgen</h1></div></div><TeamBrowser clubs={clubs} initialFavorites={favorites.map(item=>item.teamId)}/></PageShell>}
