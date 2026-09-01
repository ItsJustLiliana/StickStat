import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const form=readFileSync("components/profile-forms.tsx","utf8");
const route=readFileSync("app/api/auth/logout/route.ts","utf8");

describe("uitloggen via profiel",()=>{
  it("beëindigt de sessie en gaat terug naar inloggen",()=>{
    expect(form).toMatch(/send\(\s*"\/api\/auth\/logout"\s*,\s*"POST"\s*,\s*\{\s*\}\s*\)/);
    expect(form).toContain('router.replace("/login")');
    expect(form).toContain(">Uitloggen</button>");
    expect(route).toContain("destroySession()");
  });
});
