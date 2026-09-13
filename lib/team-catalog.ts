import * as cheerio from "cheerio";

export type CatalogProvider = "hockeystanden" | "hockey-belgium";
export type CatalogClub = { provider: CatalogProvider; id: string; name: string; location?: string };
export type CatalogTeam = { provider: CatalogProvider; clubId: string; clubName: string; name: string; shortName: string; identifier: string };

const headers = { "user-agent": "StickStat/1.0 (+self-hosted hockey statistics)" };

async function source(url: string) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Catalogusbron reageert met ${response.status}`);
  return response.text();
}

export async function searchCatalog(query: string): Promise<CatalogClub[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const [netherlands, belgium] = await Promise.all([searchNetherlands(term), searchBelgium(term)]);
  return [...netherlands, ...belgium];
}

async function searchNetherlands(query: string): Promise<CatalogClub[]> {
  const $ = cheerio.load(await source(`https://hockeystanden.nl/clubs?q=${encodeURIComponent(query)}`));
  const clubs: CatalogClub[] = [];
  $("a[href^='/clubs/']").each((_, link) => {
    const href = $(link).attr("href");
    const name = $(link).text().replace(/\s+/g, " ").trim();
    if (!href || !name || href === "/clubs") return;
    const location = $(link).closest("tr").find("td").eq(1).text().trim() || undefined;
    clubs.push({ provider: "hockeystanden", id: href.replace("/clubs/", "").replace(/\/$/, ""), name, location });
  });
  return unique(clubs, club => club.id).slice(0, 20);
}

async function searchBelgium(query: string): Promise<CatalogClub[]> {
  const response = await fetch(`https://hockey.be/wp-json/sportlink-api/cached/?endpoint=autocomplete&term=${encodeURIComponent(query)}`, { headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!response.ok) return [];
  const raw = await response.json() as Array<{ id?: string; label?: string; value?: string }> | Record<string, { id?: string; label?: string; value?: string } | boolean>;
  const data = Array.isArray(raw) ? raw : Object.values(raw).filter((item): item is { id?: string; label?: string; value?: string } => typeof item === "object" && item !== null);
  return data.flatMap(item => {
    const label = item.label ?? item.value;
    if (!item.id || !label) return [];
    const match = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    return [{ provider: "hockey-belgium" as const, id: item.id, name: match?.[1] ?? label, location: match?.[2] }];
  });
}

export async function catalogTeams(provider: CatalogProvider, clubId: string, clubName: string): Promise<CatalogTeam[]> {
  return provider === "hockeystanden" ? netherlandsTeams(clubId, clubName) : belgiumTeams(clubId, clubName);
}

async function netherlandsTeams(clubId: string, clubName: string): Promise<CatalogTeam[]> {
  const $ = cheerio.load(await source(`https://hockeystanden.nl/clubs/${encodeURIComponent(clubId)}`));
  const teams: CatalogTeam[] = [];
  $("a[href^='/team/']").each((_, link) => {
    const href = $(link).attr("href");
    const shortName = $(link).text().replace(/\s+/g, " ").trim();
    if (!href || !shortName) return;
    teams.push({ provider: "hockeystanden", clubId, clubName, name: shortName.replace(new RegExp(`^${escapeRegExp(clubName)}\\s+`, "i"), "") || shortName, shortName, identifier: href.replace("/team/", "").replace(/\/$/, "") });
  });
  return unique(teams, team => team.identifier).slice(0, 250);
}

async function belgiumTeams(clubId: string, clubName: string): Promise<CatalogTeam[]> {
  const today = new Date(), from = new Date(today), to = new Date(today);
  from.setDate(from.getDate() - 90); to.setDate(to.getDate() + 270);
  const dates = `from=${dateValue(from)}&to=${dateValue(to)}`;
  const endpoint = (kind: "program" | "results") => `https://hockey.be/wp-json/sportlink-api/cached?lang=nl&endpoint=${kind}&clubid=${encodeURIComponent(clubId)}&facilityid=&poolid=0&subpool=A&${dates}`;
  const responses = await Promise.all([endpoint("program"), endpoint("results")].map(async url => {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });
    return response.ok ? response.json() as Promise<{ data?: string[][] }> : { data: [] };
  }));
  const teams: CatalogTeam[] = [];
  for (const response of responses) for (const row of response.data ?? []) for (const index of [3, row.length - 1]) {
    const text = cheerio.load(row[index] ?? "").text().replace(/\s+/g, " ").trim();
    if (!text || !text.toLocaleLowerCase().startsWith(clubName.toLocaleLowerCase())) continue;
    const name = text.slice(clubName.length).trim();
    if (!name) continue;
    teams.push({ provider: "hockey-belgium", clubId, clubName, name, shortName: text, identifier: `${clubId}::${name}` });
  }
  return unique(teams, team => team.identifier).sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

function dateValue(date: Date) { return date.toISOString().slice(0, 10); }
function unique<T>(items: T[], key: (item: T) => string) { return [...new Map(items.map(item => [key(item), item])).values()]; }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
