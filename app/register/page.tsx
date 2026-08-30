import {RegisterForm} from "@/components/register-form";
import {currentUser} from "@/lib/auth";
import {redirect} from "next/navigation";
export const dynamic="force-dynamic";
export default async function Register(){if(await currentUser())redirect("/dashboard");return <main className="login-page"><section className="login-brand"><div className="brand"><span className="brand-mark">S</span>StickStat</div><div><span className="eyebrow" style={{color:"#c9f45b"}}>Your team. Your stats.</span><h1>Sluit je aan bij je team.</h1><p>Maak je account. Je clubbeheerder regelt daarna je toegang.</p></div><small>Gebouwd voor het hockeyveld.</small></section><section className="login-panel"><RegisterForm/></section></main>}
