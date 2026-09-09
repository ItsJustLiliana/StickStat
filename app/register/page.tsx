import {RegisterForm} from "@/components/register-form";
import {currentUser} from "@/lib/auth";
import {db} from "@/lib/db";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Register(){if(await currentUser())redirect("/dashboard");const clubs=await db.club.findMany({include:{teams:{orderBy:{name:"asc"}}},orderBy:{name:"asc"}});return <main className="login-page"><section className="login-brand"><div className="brand"><span className="brand-mark">S</span>StickStat</div><div><span className="eyebrow" style={{color:"#c9f45b"}}>Your team. Your stats.</span><h1>Sluit je aan bij je team.</h1><p>Maak je account. Je teambeheerder keurt daarna je aanmelding goed.</p></div><small>Gebouwd voor het hockeyveld.</small></section><section className="login-panel"><RegisterForm clubs={clubs.map(club=>({id:club.id,name:club.name,teams:club.teams.map(team=>({id:team.id,name:team.name}))}))}/></section></main>}
