import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { clubNameFromTeamName, clubSlug } from "@/lib/team-names";
import { HockeyBelgiumProvider } from "@/providers/hockey-belgium";
import { HockeyStandenProvider } from "@/providers/hockeystanden";
import type { ExternalMatch, HockeyDataProvider } from "@/providers/types";

const providers: Record<string, HockeyDataProvider> = { hockeystanden: new HockeyStandenProvider(), "hockey-belgium": new HockeyBelgiumProvider() };

function seasonFor(date: Date) {
  const year = date.getUTCFullYear(), start = date.getUTCMonth() >= 6 ? year : year - 1;
  return { name: `${start}/${start + 1}`, startDate: new Date(Date.UTC(start, 6, 1)), endDate: new Date(Date.UTC(start + 1, 5, 30, 23, 59, 59)) };
}

async function opponentTeam(name: string) {
  const clubName = clubNameFromTeamName(name), slug = clubSlug(clubName);
  const club = await db.club.upsert({ where: { slug }, update: {}, create: { name: clubName, slug } });
  return db.team.upsert({ where: { clubId_name: { clubId: club.id, name } }, update: {}, create: { clubId: club.id, name, shortName: name } });
}

async function saveMatch(team: { id: string; name: string; shortName: string }, provider: string, external: ExternalMatch) {
  const seasonData = seasonFor(external.date);
  const season = await db.season.upsert({ where: { name: seasonData.name }, update: {}, create: seasonData });
  const ownHome = [team.name, team.shortName].some(name => external.homeTeam.toLowerCase().includes(name.toLowerCase()));
  const ownAway = [team.name, team.shortName].some(name => external.awayTeam.toLowerCase().includes(name.toLowerCase()));
  const home = ownHome ? team : await opponentTeam(external.homeTeam);
  const away = ownAway ? team : await opponentTeam(external.awayTeam);
  const dayStart = new Date(Date.UTC(external.date.getUTCFullYear(), external.date.getUTCMonth(), external.date.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  // Natural-match fallback: date:{gte:dayStart,lt:dayEnd}
  const where = { OR: [{ externalProvider: provider, externalId: external.externalId }, { seasonId: season.id, homeTeamId: home.id, awayTeamId: away.id, date: { gte: dayStart, lt: dayEnd } }] };
  const data = { externalProvider: provider, externalId: external.externalId, seasonId: season.id, competition: external.competition, homeTeamId: home.id, awayTeamId: away.id, date: external.date, startTime: external.startTime, venue: external.venue, status: external.status, homeScore: external.homeScore, awayScore: external.awayScore, lastSyncedAt: new Date() };
  const existing = await db.match.findFirst({ where, orderBy: { createdAt: "asc" } });
  if (existing) { await db.match.update({ where: { id: existing.id }, data: { ...data, date: existing.date } }); return "updated" as const; }
  try {
    await db.match.create({ data });
    return "created" as const;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const concurrent = await db.match.findFirst({ where, orderBy: { createdAt: "asc" } });
    if (!concurrent) throw error;
    await db.match.update({ where: { id: concurrent.id }, data: { ...data, date: concurrent.date } });
    return "updated" as const;
  }
}

export async function syncTeam(teamId: string) {
  const team = await db.team.findUnique({ where: { id: teamId }, include: { club: true } });
  if (!team?.externalProvider || !team.externalIdentifier) throw new Error("Team heeft geen providerconfiguratie");
  const provider = providers[team.externalProvider];
  if (!provider) throw new Error(`Onbekende provider: ${team.externalProvider}`);
  const lock = Number.parseInt(createHash("sha1").update(teamId).digest("hex").slice(0, 7), 16);
  const locks = await db.$queryRaw<Array<{ locked: boolean }>>`SELECT pg_try_advisory_lock(${lock}) AS locked`;
  if (!locks[0]?.locked) throw new Error("Synchronisatie loopt al");
  const run = await db.syncRun.create({ data: { teamId, status: "running" } });
  logger.info("Sync gestart", { teamId, provider: team.externalProvider });
  try {
    const [clubData, matches, standings] = await Promise.all([provider.getClub(team.externalIdentifier), provider.getMatches(team.externalIdentifier), provider.getStandings(team.externalIdentifier)]);
    let created = 0, updated = 0;
    if (clubData?.logoUrl) await db.club.update({ where: { id: team.clubId }, data: { logoUrl: clubData.logoUrl } });
    for (const external of matches) {
      if (await saveMatch(team, team.externalProvider, external) === "created") created++; else updated++;
    }
    for (const row of standings) {
      const seasonData = seasonFor(new Date());
      const season = await db.season.upsert({ where: { name: seasonData.name }, update: {}, create: seasonData });
      const standingTeam = [team.name, team.shortName].some(name => row.team.toLowerCase().includes(name.toLowerCase())) ? team : await opponentTeam(row.team);
      await db.standing.upsert({ where: { seasonId_competition_teamId: { seasonId: season.id, competition: row.competition, teamId: standingTeam.id } }, update: { ...row, team: undefined, lastSyncedAt: new Date() }, create: { seasonId: season.id, competition: row.competition, teamId: standingTeam.id, position: row.position, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, goalsFor: row.goalsFor, goalsAgainst: row.goalsAgainst, goalDifference: row.goalDifference, points: row.points, lastSyncedAt: new Date() } });
    }
    await db.syncRun.update({ where: { id: run.id }, data: { status: "success", completedAt: new Date(), newMatches: created, updatedMatches: updated } });
    logger.info("Sync voltooid", { teamId, created, updated });
    return { created, updated, standings: standings.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.syncRun.update({ where: { id: run.id }, data: { status: "failed", completedAt: new Date(), error: message.slice(0, 1000) } });
    logger.error("Sync mislukt", { teamId, error: message });
    throw error;
  } finally { await db.$queryRaw`SELECT pg_advisory_unlock(${lock})`; }
}

export async function syncAllTeams() {
  const teams = await db.team.findMany({ where: { externalProvider: { not: null }, externalIdentifier: { not: null }, OR: [{ favoritedBy: { some: {} } }, { memberships: { some: {} } }, { club: { memberships: { some: {} } } }] } });
  let succeeded = 0, failed = 0;
  for (const team of teams) try { await syncTeam(team.id); succeeded++; } catch { failed++; /* Logged per team; the next hourly run retries it. */ }
  return { attempted: teams.length, succeeded, failed };
}
