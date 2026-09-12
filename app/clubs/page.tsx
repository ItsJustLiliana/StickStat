import {PageShell} from "@/components/page-shell";
import {TeamBrowser} from "@/components/team-browser";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Clubs(){const user=await currentUser();if(!user)redirect("/login");const clubs=await db.club.findMany({select:{id:true,name:true},orderBy:{name:"asc"}});return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">Kijker</span><h1>Teams volgen</h1></div></div><TeamBrowser clubs={clubs}/></PageShell>}
