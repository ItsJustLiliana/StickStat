"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {BarChart3, CalendarDays, Ellipsis, Inbox, LayoutDashboard, Shield, Table2, Users} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {AndroidAppDownload} from "./android-app-download";
import {NotificationsMenu} from "./notifications-menu";
import {ThemeToggle} from "./theme-toggle";

const links = [
  {href:"/dashboard", label:"Dashboard", icon:LayoutDashboard}, {href:"/agenda", label:"Agenda", icon:CalendarDays},
  {href:"/standings", label:"Stand", icon:Table2}, {href:"/players", label:"Spelers", icon:Users}, {href:"/statistics", label:"Statistieken", icon:BarChart3},
];

export function AppNav({name, photoPath, admin, teamAdmin}:{name:string; photoPath:string|null; admin:boolean; teamAdmin:boolean}) {
  const pathname = usePathname(), [hasDownload, setHasDownload] = useState(false), [joinCount, setJoinCount] = useState(0), [notificationCount, setNotificationCount] = useState(0), [moreOpen, setMoreOpen] = useState(false), [compact, setCompact] = useState(false), moreRef = useRef<HTMLDivElement>(null), brandRef = useRef<HTMLAnchorElement>(null), actionsRef = useRef<HTMLDivElement>(null);
  const isCurrent = (href:string) => pathname === href || pathname.startsWith(`${href}/`) || (href === "/agenda" && ["/matches", "/trainings"].some(root => pathname === root || pathname.startsWith(`${root}/`))) || (href === "/players" && ["/team-members"].some(root => pathname === root || pathname.startsWith(`${root}/`)));
  useEffect(() => { const timer = window.setTimeout(() => setHasDownload(/Android/i.test(navigator.userAgent) && !("StickStatApp" in window)), 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { fetch("/api/notifications").then(response => response.json()).then(body => setNotificationCount((body.data ?? []).filter((item:{readAt:string|null}) => !item.readAt).length)).catch(() => {}); if (teamAdmin) fetch("/api/team-join-requests").then(response => response.json()).then(body => setJoinCount(Number(body.data?.count) || 0)).catch(() => {}); }, [teamAdmin]);
  useEffect(() => { if (!moreOpen) return; const close = (event:PointerEvent) => { if (moreRef.current && !moreRef.current.contains(event.target as Node)) setMoreOpen(false); }; document.addEventListener("pointerdown", close); return () => document.removeEventListener("pointerdown", close); }, [moreOpen]);
  useEffect(() => { const check = () => { const brand = brandRef.current?.getBoundingClientRect(), actions = actionsRef.current?.getBoundingClientRect(); if (!brand || !actions) return; if (window.innerWidth >= 640) setCompact(false); else if (actions.left - brand.right < 18) setCompact(true); }; const observer = new ResizeObserver(check); if (brandRef.current) observer.observe(brandRef.current); if (actionsRef.current) observer.observe(actionsRef.current); window.addEventListener("resize", check); check(); return () => { observer.disconnect(); window.removeEventListener("resize", check); }; }, [hasDownload, joinCount, notificationCount, compact]);
  const showInbox = teamAdmin && joinCount > 0, showNotifications = notificationCount > 0;
  const platformAction = admin && <Link className="theme-toggle" href="/admin" aria-current={isCurrent("/admin") ? "page" : undefined} title="Platformbeheer" aria-label="Platformbeheer"><Shield size={20}/></Link>;
  const inboxAction = showInbox && <Link className="theme-toggle inbox-link" href="/team-requests" aria-current={isCurrent("/team-requests") ? "page" : undefined} title={`${joinCount} openstaande teamaanmelding${joinCount === 1 ? "" : "en"}`} aria-label="Teamaanmeldingen"><Inbox size={20}/><i>{joinCount}</i></Link>;
  const notificationAction = showNotifications && <NotificationsMenu/>;
  const extraActions = <>{platformAction}{inboxAction}{notificationAction}</>;
  return <><header className="topbar">
    <Link ref={brandRef} className="brand" href="/dashboard"><span className="brand-mark">S</span>StickStat</Link>
    <nav className="topnav" aria-label="Hoofdnavigatie">{links.map(link => <Link key={link.href} href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined}>{link.label}</Link>)}</nav>
    <div className="account-actions" ref={actionsRef}><AndroidAppDownload/>{compact ? <div className="topbar-more" ref={moreRef}><button className="theme-toggle" type="button" aria-label="Meer opties" aria-expanded={moreOpen} onClick={() => setMoreOpen(value => !value)}><Ellipsis size={21}/></button>{moreOpen && <div className="topbar-more-menu">{extraActions}</div>}</div> : extraActions}<ThemeToggle/><Link className="avatar" href="/profile" aria-current={isCurrent("/profile") ? "page" : undefined} title={`${name} - Profiel`}>{photoPath ? <Image unoptimized width={36} height={36} src={photoPath} alt=""/> : name[0]?.toUpperCase()}</Link></div>
  </header><nav className="mobile-nav" aria-label="Mobiele navigatie">{links.map(({href, label, icon:Icon}) => <Link key={href} href={href} aria-current={isCurrent(href) ? "page" : undefined}><Icon size={19}/>{label}</Link>)}</nav></>;
}
