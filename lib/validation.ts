import { z } from "zod";
export const usernameSchema=z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/,"Gebruik alleen letters, cijfers, punt, streepje of underscore").transform(value=>value.toLowerCase());
export const loginSchema = z.object({ username: usernameSchema, password: z.string().min(8).max(128) });
export const strongPasswordSchema=z.string().min(12).max(128).regex(/[a-z]/,"Gebruik een kleine letter").regex(/[A-Z]/,"Gebruik een hoofdletter").regex(/[0-9]/,"Gebruik een cijfer");
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: usernameSchema.optional(),
  email: z.string().email().optional(),
  password: strongPasswordSchema,
  confirmPassword: z.string().min(1),
  inviteToken: z.string().regex(/^[A-Za-z0-9_-]{32}$/).optional(),
}).refine(value=>Boolean(value.username||value.email),{message:"Gebruikersnaam is verplicht",path:["username"]}).refine((value)=>value.password===value.confirmPassword,{message:"Wachtwoorden komen niet overeen",path:["confirmPassword"]}).transform(value=>({...value,username:value.username??value.email!.split("@")[0].toLowerCase()}));
export const playerSchema = z.object({ firstName: z.string().trim().min(1).max(80), namePrefix: z.string().trim().max(30).nullable().optional(), lastName: z.string().trim().min(1).max(80), shirtNumber: z.number().int().min(0).max(999).nullable().optional(), position: z.string().trim().max(80).nullable().optional(), active: z.boolean().default(true), trainingMember:z.boolean().default(true), matchMember:z.boolean().default(true) });
export const eventSchema = z.object({ playerId: z.string().cuid().nullable().optional(), relatedPlayerId: z.string().cuid().nullable().optional(), minute: z.number().int().min(0).max(120).nullable().optional(), type: z.enum(["goal","assist","green_card","yellow_card","red_card","substitution","save","penalty_corner","penalty_stroke","custom"]), notes: z.string().max(1000).nullable().optional() });
export const statsSchema = z.object({ playerId: z.string().cuid(), started: z.boolean().default(false), minutesPlayed: z.number().int().min(0).max(120).nullable().optional(), goals: z.number().int().min(0).max(50).default(0), assists: z.number().int().min(0).max(50).default(0), saves: z.number().int().min(0).max(100).default(0), mvp: z.boolean().default(false), notes: z.string().max(2000).nullable().optional() });
