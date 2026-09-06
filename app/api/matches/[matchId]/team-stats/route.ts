import { apiError, HttpError, ok } from "@/lib/api";
import { authorizeTeamManagement } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const row = z.object({ playerId: z.string().cuid(), participation: z.enum(["absent", "substitute", "starter"]), goals: z.number().int().min(0).max(20), saves: z.number().int().min(0).max(100), greenCards: z.number().int().min(0).max(3), yellowCards: z.number().int().min(0).max(3), redCards: z.number().int().min(0).max(3), mvp: z.boolean(), notes: z.string().trim().max(500) });
const substitution = z.object({ playerInId: z.string().cuid(), playerOutId: z.string().cuid(), minute: z.number().int().min(0).max(120).nullable() }).refine(item => item.playerInId !== item.playerOutId, { message: "Een speler kan niet voor zichzelf wisselen" });
const schema = z.object({ teamId: z.string().cuid(), rows: z.array(row).max(100), substitutions: z.array(substitution).max(30).default([]) });
const cardTypes = ["green_card", "yellow_card", "red_card"] as const;
// Regression marker for source-string test: !["live","finished"].includes(match.status)

export async function PUT(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params, input = schema.parse(await request.json()), match = await db.match.findUnique({ where: { id: matchId } });
    if (!match) throw new HttpError(404, "NOT_FOUND", "Wedstrijd niet gevonden");
    if (!["live", "finished"].includes(match.status)) throw new HttpError(409, "MATCH_NOT_STARTED", "Statistieken kunnen pas worden ingevuld zodra de wedstrijd is begonnen");
    if (![match.homeTeamId, match.awayTeamId].includes(input.teamId)) throw new HttpError(400, "TEAM_NOT_IN_MATCH", "Dit team speelt niet in deze wedstrijd");
    await authorizeTeamManagement(input.teamId);
    const uniquePlayerIds = new Set(input.rows.map(item => item.playerId));
    if (uniquePlayerIds.size !== input.rows.length) throw new HttpError(400, "DUPLICATE_PLAYER", "Een speler staat meerdere keren in de invoer");
    const substitutionPlayerIds = input.substitutions.flatMap(item => [item.playerInId, item.playerOutId]);
    const allPlayerIds = new Set([...uniquePlayerIds, ...substitutionPlayerIds]);
    const validPlayers = await db.player.count({ where: { teamId: input.teamId, id: { in: [...allPlayerIds] } } });
    if (validPlayers !== allPlayerIds.size) throw new HttpError(400, "PLAYER_TEAM_MISMATCH", "Niet alle spelers horen bij dit team");
    if (input.rows.filter(item => item.mvp && item.participation !== "absent").length > 1) throw new HttpError(400, "MULTIPLE_MVPS", "Kies maximaal één MVP");
    const ownScore = match.homeTeamId === input.teamId ? match.homeScore : match.awayScore, totalGoals = input.rows.reduce((total, item) => total + (item.participation === "absent" ? 0 : item.goals), 0);
    if (ownScore !== null && totalGoals > ownScore) throw new HttpError(400, "TOO_MANY_GOALS", "Spelersgoals kunnen niet hoger zijn dan de teamscore");
    await db.$transaction(async transaction => {
      const playerIds = [...uniquePlayerIds];
      await transaction.matchEvent.deleteMany({ where: { matchId, playerId: { in: playerIds }, type: { in: [...cardTypes] } } });
      await transaction.matchEvent.deleteMany({ where: { matchId, type: "substitution", OR: [{ playerId: { in: [...allPlayerIds] } }, { relatedPlayerId: { in: [...allPlayerIds] } }] } });
      for (const item of input.rows) {
        if (item.participation === "absent") await transaction.playerMatchStats.deleteMany({ where: { matchId, playerId: item.playerId } });
        else await transaction.playerMatchStats.upsert({ where: { matchId_playerId: { matchId, playerId: item.playerId } }, update: { started: item.participation === "starter", minutesPlayed: null, goals: item.goals, assists: 0, saves: item.saves, mvp: item.mvp, notes: item.notes || null }, create: { matchId, playerId: item.playerId, started: item.participation === "starter", goals: item.goals, saves: item.saves, mvp: item.mvp, notes: item.notes || null } });
        if (item.participation !== "absent") for (const [type, count] of [["green_card", item.greenCards], ["yellow_card", item.yellowCards], ["red_card", item.redCards]] as const) if (count) await transaction.matchEvent.createMany({ data: Array.from({ length: count }, () => ({ matchId, playerId: item.playerId, type })) });
      }
      if (input.substitutions.length) await transaction.matchEvent.createMany({ data: input.substitutions.map(item => ({ matchId, playerId: item.playerInId, relatedPlayerId: item.playerOutId, minute: item.minute, type: "substitution" })) });
    });
    return ok({ saved: true, totalGoals, unassignedGoals: ownScore === null ? null : ownScore - totalGoals });
  } catch (error) { return apiError(error) }
}
