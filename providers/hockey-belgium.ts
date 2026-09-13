import * as cheerio from "cheerio";
import type { ExternalMatch, ExternalStanding, ExternalTeam, HockeyDataProvider } from "./types";

const baseUrl = "https://hockey.be/wp-json/sportlink-api/cached";
const headers = { "user-agent": "StickStat/1.0 (+self-hosted hockey statistics)" };

export class HockeyBelgiumProvider implements HockeyDataProvider {
  async getClub(identifier: string) { void identifier; return null; }
  async getTeam(identifier: string): Promise<ExternalTeam | null> {
    const [, team] = splitIdentifier(identifier);
    return team ? { name: team } : null;
  }
  async getMatches(identifier: string): Promise<ExternalMatch[]> {
    const [clubId, team] = splitIdentifier(identifier);
    if (!clubId || !team) return [];
    const today = new Date(), from = new Date(today), to = new Date(today);
    from.setDate(from.getDate() - 180); to.setDate(to.getDate() + 365);
    const params = `lang=nl&clubid=${encodeURIComponent(clubId)}&facilityid=&poolid=0&subpool=A&from=${dateValue(from)}&to=${dateValue(to)}`;
    const responses = await Promise.all(["program", "results"].map(kind => request(`${params}&endpoint=${kind}`)));
    const matches = responses.flatMap(data => (data.data ?? []).flatMap(row => parseRow(row, team)));
    return [...new Map(matches.map(match => [match.externalId, match])).values()];
  }
  async getStandings(identifier: string): Promise<ExternalStanding[]> {
    const [clubId] = splitIdentifier(identifier);
    if (!clubId) return [];
    const data = await request(`lang=nl&endpoint=standing&clubid=${encodeURIComponent(clubId)}&facilityid=&poolid=0&subpool=A`);
    return (data.data ?? []).flatMap(row => {
      const [position, team, played, won, lost, drawn, goalsFor, goalsAgainst, points] = row;
      const parsed = [position, played, won, lost, drawn, goalsFor, goalsAgainst, points].map(Number);
      if (!text(team) || parsed.some(Number.isNaN)) return [];
      return [{ position: parsed[0], team: text(team), played: parsed[1], won: parsed[2], lost: parsed[3], drawn: parsed[4], goalsFor: parsed[5], goalsAgainst: parsed[6], goalDifference: parsed[5] - parsed[6], points: parsed[7], competition: "Competitie" }];
    });
  }
}

async function request(params: string): Promise<{ data?: string[][] }> {
  const response = await fetch(`${baseUrl}?${params}`, { headers, signal: AbortSignal.timeout(15_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Hockey Belgium HTTP ${response.status}`);
  return response.json();
}

function parseRow(row: string[], team: string): ExternalMatch[] {
  const dateText = text(row[0]).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const home = text(row[3]), away = text(row.at(-1));
  if (!dateText || !home || !away || (!home.endsWith(team) && !away.endsWith(team))) return [];
  const date = new Date(Date.UTC(Number(dateText[3]), Number(dateText[2]) - 1, Number(dateText[1])));
  const score = row.map(text).join(" ").match(/\b(\d+)\s*-\s*(\d+)\b/);
  const competition = text(row[2]) || undefined;
  const startTime = text(row[1]).match(/\b\d{2}:\d{2}\b/)?.[0];
  return [{ externalId: `be:${date.toISOString().slice(0, 10)}:${home}:${away}`, date, startTime, homeTeam: home, awayTeam: away, homeScore: score ? Number(score[1]) : undefined, awayScore: score ? Number(score[2]) : undefined, status: score ? "finished" : "scheduled", competition }];
}

function text(value: string | undefined) { return cheerio.load(value ?? "").text().replace(/\s+/g, " ").trim(); }
function splitIdentifier(identifier: string) { return identifier.split("::", 2); }
function dateValue(date: Date) { return date.toISOString().slice(0, 10); }
