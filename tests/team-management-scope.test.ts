import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const page=readFileSync("app/team/manage/page.tsx","utf8");

describe("teamscope in teambeheer",()=>{
  it("haalt alleen spelersprofielen van het geselecteerde team op",()=>{
    expect(page).toContain("where:{teamId:team.id}");
    expect(page).toContain('{active:"desc"}');
  });

  it("verbergt spelersaccounts van andere teams uit de kandidatenlijst",()=>{
    expect(page).toContain("{teamMemberships:{some:{teamId:team.id}}}");
    expect(page).toContain("{player:{is:null}}");
    expect(page).toContain("{player:{is:{teamId:team.id}}}");
  });

  it("stelt het beheerformulier opnieuw in bij een teamwissel",()=>{
    expect(page).toContain("<TeamManagementPanel key={team.id}");
  });
});
