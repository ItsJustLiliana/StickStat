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
    expect(route).toContain("[data.firstName,data.namePrefix,data.lastName].filter(Boolean).join");
    expect(schema).toContain("namePrefix String?");
  });

  it("houdt rugnummer en positie optioneel",()=>{
    expect(form).toContain('placeholder="Rugnummer (optioneel)"');
    expect(form).toContain('placeholder="Positie (optioneel)"');
  });

  it("kan een speler veilig uit de actieve selectie verwijderen",()=>{
    expect(form).toContain("Spelersprofielen");
    expect(form).toContain('"DELETE",{playerId:player.id}');
    expect(route).toContain("data:{active:false,userId:null}");
    expect(route).toContain('filter(role=>role!=="player")');
  });

  it("laat alleen teambeheerders spelers maken, wijzigen en archiveren",()=>{
    expect(route.match(/authorizeTeamAdmin\(teamId\)/g)).toHaveLength(3);
    expect(route).toContain("export async function PATCH");
    expect(form).toContain("Gearchiveerde spelers");
    expect(form).toContain("Herstellen");
  });
});
