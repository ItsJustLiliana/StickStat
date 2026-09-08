import {z} from "zod";

export const matchTaskTypes = ["balls", "driving", "bottles"] as const;
export type MatchTaskType = typeof matchTaskTypes[number];

export const matchTaskLabels: Record<MatchTaskType, string> = {
  balls: "Ballen regelen & opruimen",
  driving: "Rijden",
  bottles: "Bidons",
};

export const createMatchTaskSchema = z.object({
  teamId: z.string().cuid(),
  taskType: z.enum(matchTaskTypes),
  userId: z.string().cuid(),
});

export const deleteMatchTaskSchema = z.object({
  teamId: z.string().cuid(),
  taskId: z.string().cuid(),
});
