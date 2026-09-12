import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {ClubTeamList} from "@/components/club-team-list";
import {PageShell} from "@/components/page-shell";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
export const dynamic="force-dynamic";
export default async function ClubPage({params}:{params:Promise<{clubId:string}>}){const [{clubId},user]=await Promise.all([params,currentUser()]);if(!user)redirect("/login");const [club,favorites]=await Promise.all([db.club.findUnique({where:{id:clubId},include:{teams:{select:{id:true,name:true,shortName:true},orderBy:{name:"asc"}}}}),db.favoriteTeam.findMany({where:{userId:user.id},select:{teamId:true}})]);if(!club)notFound();return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Club</span><h1>{club.name}</h1></div><Link className="button secondary" href="/clubs">Alle clubs</Link></div><ClubTeamList teams={club.teams} initialFavorites={favorites.map(item=>item.teamId)}/></PageShell>}
