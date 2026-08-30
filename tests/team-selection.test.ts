import {describe,expect,it} from "vitest";
import {selectPreferredTeam} from "../lib/team-selection";

const teams=[{id:"alphabetical"},{id:"membership"},{id:"player"}];

describe("standaardteam",()=>{
  it("respecteert een expliciet gekozen team",()=>expect(selectPreferredTeam(teams,"alphabetical","player",["membership"])?.id).toBe("alphabetical"));
  it("geeft het gekoppelde spelersprofiel voorrang",()=>expect(selectPreferredTeam(teams,undefined,"player",["membership"])?.id).toBe("player"));
  it("gebruikt anders het eigen teamlidmaatschap",()=>expect(selectPreferredTeam(teams,undefined,undefined,["membership"])?.id).toBe("membership"));
});
