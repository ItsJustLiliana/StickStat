import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CatalogTeamList } from "@/components/catalog-team-list";
import { PageShell } from "@/components/page-shell";
import { currentUser } from "@/lib/auth";
import { catalogTeams, type CatalogProvider } from "@/lib/team-catalog";

export const dynamic = "force-dynamic";
export default async function CatalogClubPage({ params, searchParams }: { params: Promise<{ provider: string; catalogClubId: string }>; searchParams: Promise<{ name?: string }> }) {
  const [{ provider, catalogClubId }, query, user] = await Promise.all([params, searchParams, currentUser()]);
  if (!user) redirect("/login");
  if ((provider !== "hockeystanden" && provider !== "hockey-belgium") || !query.name) notFound();
  const teams = await catalogTeams(provider as CatalogProvider, catalogClubId, query.name);
  return <PageShell user={user}><div className="page-head"><div><span className="eyebrow">{provider === "hockeystanden" ? "Nederland" : "België"}</span><h1>{query.name}</h1></div><Link className="button secondary" href="/clubs">Andere club</Link></div><CatalogTeamList teams={teams} /></PageShell>;
}
