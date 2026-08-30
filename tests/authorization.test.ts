import {describe,expect,it} from "vitest";import {hasPlatformRole} from "../lib/permissions";
describe("autorisatie",()=>{it("geeft alleen platform-admin adminrechten",()=>{expect(hasPlatformRole("admin","admin")).toBe(true);expect(hasPlatformRole("user","admin")).toBe(false);expect(hasPlatformRole("user","user")).toBe(true)});});
