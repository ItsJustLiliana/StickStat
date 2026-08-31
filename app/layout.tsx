import type { Metadata } from "next";
import "./globals.css";
import "./management.css";
export const metadata:Metadata={title:{default:"StickStat",template:"%s · StickStat"},description:"StickStat — Your team. Your stats.",applicationName:"StickStat"};
const themeScript=`try{document.documentElement.dataset.theme=localStorage.getItem("stickstat-theme")==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`;
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head><body>{children}</body></html>}
