import {apiError, ok} from "@/lib/api";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser();
    const teamIds = user.platformRole === "admin" ? undefined : user.teamMemberships.filter(membership => membership.roles.includes("team_admin")).map(membership => membership.teamId);
    const count = await db.teamJoinRequest.count({where:{status:"pending", ...(teamIds ? {teamId:{in:teamIds}} : {})}});
    return ok({count});
  } catch (error) { return apiError(error); }
}
