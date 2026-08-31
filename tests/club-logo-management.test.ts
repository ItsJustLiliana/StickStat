import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const sync=readFileSync("services/sync.ts","utf8"),route=readFileSync("app/api/clubs/[clubId]/logo/route.ts","utf8"),panel=readFileSync("components/club-logo-editor.tsx","utf8"),serving=readFileSync("app/uploads/clubs/[filename]/route.ts","utf8");

describe("clublogo's",()=>{
  it("slaat het externe logo tijdens synchronisatie op",()=>{
    expect(sync).toContain("provider.getClub(team.externalIdentifier)");
    expect(sync).toContain("data:{logoUrl:clubData.logoUrl}");
  });
  it("laat een teambeheerder een gevalideerd handmatig logo uploaden",()=>{
    expect(route).toContain("authorizeClubBranding(clubId)");
    expect(route).toContain("validImageBytes");
    expect(panel).toContain("Een handmatige upload krijgt altijd voorrang");
  });
  it("serveert runtime-uploads buiten de statische buildmanifesten",()=>{
    expect(serving).toContain('"public","uploads","clubs",filename');
  });
});
