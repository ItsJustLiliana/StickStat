import {apiError, HttpError, ok} from "@/lib/api";
import {authorizeTeamManagement} from "@/lib/auth";
import {db} from "@/lib/db";
import {lineupSchema} from "@/lib/lineup";

export async function PUT(request: Request, {params}: {params: Promise<{matchId: string}>}) {
  try {
    const {matchId} = await params, input = lineupSchema.parse(await request.json());
    await authorizeTeamManagement(input.teamId);
    const match = await db.match.findUnique({where: {id: matchId}});
    if (!match || ![match.homeTeamId, match.awayTeamId].includes(input.teamId)) throw new HttpError(404, "NOT_FOUND", "Wedstrijd niet gevonden");
    const ids = input.positions.filter((id): id is string => id !== null);
    const count = await db.player.count({where: {id: {in: ids}, teamId: input.teamId, active: true, matchMember: true}});
    if (count !== ids.length) throw new HttpError(400, "INVALID_PLAYERS", "Kies spelers uit de actieve wedstrijdselectie");
    const data = {formation: input.formation, positions: input.positions};
    return ok(await db.matchTeamPlan.upsert({where: {matchId_teamId: {matchId, teamId: input.teamId}}, create: {matchId, teamId: input.teamId, ...data}, update: data}));
  } catch (error) {return apiError(error);}
}
