import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {createInviteToken,hashInviteToken,validInviteToken} from "../lib/team-invites";
import {registerSchema} from "../lib/validation";

const schema=readFileSync("prisma/schema.prisma","utf8");
const createRoute=readFileSync("app/api/teams/[teamId]/invites/route.ts","utf8");
const acceptRoute=readFileSync("app/api/invites/accept/route.ts","utf8");
const registerRoute=readFileSync("app/api/auth/register/route.ts","utf8");
const loginPage=readFileSync("app/login/page.tsx","utf8");

describe("teamuitnodigingen",()=>{
  it("maakt sterke tokens en bewaart alleen hun hash",()=>{
    const first=createInviteToken(),second=createInviteToken();
    expect(first).not.toBe(second);
    expect(validInviteToken(first)).toBe(true);
    expect(hashInviteToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(schema).toMatch(/tokenHash\s+String\s+@unique/);
    expect(schema).not.toMatch(/\n\s+token\s+String/);
  });

  it("laat alleen teambeheer uitnodigingen maken en intrekken",()=>{
    expect(createRoute).toContain("authorizeTeamAdmin(teamId)");
    expect(createRoute).toContain("hashInviteToken(token)");
    expect(createRoute).toContain("teamId,usedAt:null");
  });

  it("claimt een uitnodiging atomair en maakt een rolloos lidmaatschap",()=>{
    expect(acceptRoute).toContain("db.$transaction");
    expect(acceptRoute).toContain("updateMany");
    expect(acceptRoute).toContain("expiresAt:{gt:new Date()}");
    expect(acceptRoute).toContain("roles:[]");
    expect(registerRoute).toContain("teamInvite.updateMany");
    expect(registerRoute).toContain("teamMembership.create");
  });

  it("accepteert de token bij registratie en beveiligt login-redirects",()=>{
    const token=createInviteToken();
    expect(registerSchema.safeParse({name:"Nieuw lid",email:"lid@example.com",password:"SterkWachtwoord123",confirmPassword:"SterkWachtwoord123",inviteToken:token}).success).toBe(true);
    expect(loginPage).toContain('!value.startsWith("//")');
    expect(loginPage).toContain('!value.includes("\\\\")');
  });
});
