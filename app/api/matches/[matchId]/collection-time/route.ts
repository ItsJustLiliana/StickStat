import {z} from "zod";
import {apiError, HttpError, ok} from "@/lib/api";
import {authorizeTeamAdmin} from "@/lib/auth";
import {db} from "@/lib/db";

const schema = z.object({teamId: z.string().cuid(), collectionTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable()});

export async function PUT(request: Request, {params}: {params: Promise<{matchId: string}>}) {
  try {
    const [{matchId}, input] = await Promise.all([params, request.json().then(value => schema.parse(value))]);
    await authorizeTeamAdmin(input.teamId);
    const match = await db.match.findUnique({where: {id: matchId}, select: {homeTeamId: true, awayTeamId: true}});
    if (!match || ![match.homeTeamId, match.awayTeamId].includes(input.teamId)) throw new HttpError(404, "NOT_FOUND", "Wedstrijd niet gevonden");
    return ok(await db.matchTeamPlan.upsert({where: {matchId_teamId: {matchId, teamId: input.teamId}}, create: {matchId, teamId: input.teamId, collectionTime: input.collectionTime}, update: {collectionTime: input.collectionTime}}));
  } catch (error) { return apiError(error); }
}
