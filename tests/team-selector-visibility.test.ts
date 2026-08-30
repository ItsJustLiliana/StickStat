import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const selector=readFileSync("components/team-selector.tsx","utf8");
const shell=readFileSync("components/page-shell.tsx","utf8");

describe("zichtbaarheid teamkeuze",()=>{
  it("toont de teamdropdown alleen binnen een platformbeheercontext",()=>{
    expect(selector).toContain("usePlatformAdmin");
    expect(selector).toContain("if(!platformAdmin)return null");
    expect(shell).toContain('user.platformRole==="admin"');
    expect(shell).toContain("PlatformAdminProvider");
  });
});
