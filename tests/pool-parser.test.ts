import {describe,expect,it} from "vitest";
import {parseHockeyStandenMatches,parseHockeyStandenPoolPath} from "../providers/hockeystanden";

describe("HockeyStanden pool parser",()=>{
  it("vindt de algemene poulepagina",()=>expect(parseHockeyStandenPoolPath('<a href="/standen/heren/poule-a-42">Alle wedstrijden in de poule</a>')).toBe("/standen/heren/poule-a-42"));
  it("leest poulewedstrijden die geen JSON-LD hebben",()=>expect(parseHockeyStandenMatches('<p>Seizoen 2026-2027</p><li class="ml__item"><span class="ml__date">zo 06 sep</span><span class="ml__home"><span class="ml__name">Team A</span></span><span class="ml__score">4 – 2</span><span class="ml__away"><span class="ml__name">Team B</span></span></li>')[0]).toMatchObject({homeTeam:"Team A",awayTeam:"Team B",homeScore:4,awayScore:2,status:"finished",date:new Date("2026-09-06T00:00:00.000Z")}));
});
