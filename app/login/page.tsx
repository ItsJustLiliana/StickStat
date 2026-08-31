import {currentUser} from "@/lib/auth";
import {redirect} from "next/navigation";
import {LoginForm} from "@/components/login-form";

export const dynamic="force-dynamic";
function safeNext(value:string|undefined){return value?.startsWith("/")&&!value.startsWith("//")&&!value.includes("\\")?value:"/dashboard"}
export default async function Login({searchParams}:{searchParams:Promise<{next?:string}>}){const next=safeNext((await searchParams).next);if(await currentUser())redirect(next);return <main className="login-page"><section className="login-brand"><div className="brand"><span className="brand-mark">S</span>StickStat</div><div><span className="eyebrow" style={{color:"#c9f45b"}}>Your team. Your stats.</span><h1>Meer dan alleen de eindstand.</h1><p>Wedstrijden, spelers en prestaties. Eén helder teambeeld.</p></div><small>Gebouwd voor het hockeyveld.</small></section><section className="login-panel"><LoginForm returnTo={next}/></section></main>}
