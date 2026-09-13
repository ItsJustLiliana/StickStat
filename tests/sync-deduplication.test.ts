import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const sync=readFileSync(new URL("../services/sync.ts",import.meta.url),"utf8");
const agenda=readFileSync(new URL("../app/agenda/page.tsx",import.meta.url),"utf8");

describe("wedstrijd-deduplicatie",()=>{
  it("herkent een geïmporteerde wedstrijd op dezelfde kalenderdag",()=>expect(sync).toContain("date:{gte:dayStart,lt:dayEnd}"));
  it("toont per thuis-, uitteam en dag maar één wedstrijd in Agenda",()=>expect(agenda).toContain("function uniqueMatches"));
});
