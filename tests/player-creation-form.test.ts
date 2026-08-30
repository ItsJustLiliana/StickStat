import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const form=readFileSync("components/team-management-panel.tsx","utf8");
const route=readFileSync("app/api/teams/[teamId]/players/route.ts","utf8");
const schema=readFileSync("prisma/schema.prisma","utf8");

describe("speler toevoegen",()=>{
  it("vraagt voornaam, optioneel tussenvoegsel en achternaam",()=>{
    expect(form).toContain('name="firstName"');
    expect(form).toContain('name="namePrefix"');
    expect(form).toContain('name="lastName"');
    expect(form).not.toContain('name="displayName"');
  });

  it("maakt de zichtbare naam op de server",()=>{
    expect(route).toContain("[d.firstName,d.namePrefix,d.lastName].filter(Boolean).join");
    expect(schema).toContain("namePrefix String?");
  });

  it("houdt rugnummer en positie optioneel",()=>{
    expect(form).toContain('placeholder="Rugnummer (optioneel)"');
    expect(form).toContain('placeholder="Positie (optioneel)"');
  });
});
