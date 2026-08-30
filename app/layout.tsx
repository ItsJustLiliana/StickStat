import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:{default:"StickStat",template:"%s · StickStat"},description:"StickStat — Your team. Your stats.",applicationName:"StickStat"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl"><body>{children}</body></html>}
