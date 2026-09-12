import type {Metadata} from "next";
import {existsSync} from "node:fs";
import {join} from "node:path";
import "./globals.css";
import "./management.css";
import {GlobalLoadingIndicator} from "@/components/global-loading-indicator";
export const metadata:Metadata={title:{default:"StickStat",template:"%s · StickStat"},description:"StickStat — Your team. Your stats.",applicationName:"StickStat"};
export const dynamic="force-dynamic";
const themeScript=`try{document.documentElement.dataset.theme=localStorage.getItem("stickstat-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`;
function MaintenanceScreen(){return <main className="maintenance-page"><section className="maintenance-card"><span className="brand-mark">S</span><span className="eyebrow">StickStat wordt bijgewerkt</span><h1>Er wordt een serverupdate uitgevoerd.</h1><p>Dit kan enkele minuten duren. Probeer het straks opnieuw.</p></section></main>}
export default function RootLayout({children}:{children:React.ReactNode}){const maintenance=existsSync(join(process.cwd(),"public","maintenance.flag"));return <html lang="nl" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{maintenance?<MaintenanceScreen/>:<><GlobalLoadingIndicator/>{children}</>}</body></html>}
